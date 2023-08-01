const { Configuration, OpenAIApi } = require("openai");
const Bottleneck = require("bottleneck");
const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const {
  convertArrayToObject,
  readInputFromCSV,
  withTimeout,
  combineDoctorsAndBios,
  capitalizeFirstLetter,
  extractFirstThreeItems,
} = require("../src/Utils.js");

let totalAmountOfBiosNeeded = 0;
let totalAmountOfBiosCompleted = 0;

const generateBio = async (doctor, openai, event) => {
  let formattedDoctor = convertArrayToObject(doctor);
  let LGTBQFriendly = false;

  if (formattedDoctor.interests.includes("LGBTQ")) {
    LGTBQFriendly = true;
    formattedDoctor.interests = formattedDoctor.interests.replace(
      "LGBTQ Health",
      ""
    );
    console.log(formattedDoctor.interests);
  }

  if (formattedDoctor.languages.includes("English")) {
    formattedDoctor.languages = formattedDoctor.languages.replace(
      "English",
      ""
    );
  }

  const instructions = `Write a short and PROFESSIONAL bio for the following provider. You cannot exceed a word count of 120 words. ${
    LGTBQFriendly ? "Mention the the provider is LGBTQ friendly." : ""
  }Dont say "Dr. John Doe" instead say "John Doe, MD". YOU ARE CONSTRICTED TO SIMPLY THE INFORMATION PROVIDED ABOVE.`;

  const doctorPrompt = `
      Name: ${formattedDoctor.name}
      Specialties: ${formattedDoctor.specialties.toLowerCase()}
      Affiliations: ${formattedDoctor.affiliations}
      Languages: ${formattedDoctor.languages}
      Board Certs: ${formattedDoctor.certs}
      Medical School: ${formattedDoctor.medicalSchool}
      Fellowships: ${formattedDoctor.fellowships}
      Residency): ${formattedDoctor.residency}
      Clinical Titles: ${capitalizeFirstLetter(formattedDoctor.clinicalTitles)}
      Academic Titles: ${formattedDoctor.academicTitles}
      Clinical Interests: ${extractFirstThreeItems(
        formattedDoctor.interests.toLowerCase()
      )}
    `;

  const messages = [
    { role: "system", content: instructions },
    { role: "user", content: doctorPrompt },
  ];

  console.log(messages);

  totalAmountOfBiosCompleted += 1;
  event.sender.send("progress-update", {
    progress: Math.round(
      (totalAmountOfBiosCompleted / totalAmountOfBiosNeeded) * 100
    ),
  });

  const makeOpenAIRequest = async () => {
    let response;

    try {
      response = await withTimeout(
        openai.createChatCompletion({
          model: "gpt-4",
          messages,
        }),
        30000
      );
    } catch (error) {
      console.log(error.response);
      const bio = await makeOpenAIRequest();
      return bio;
    }

    const bio = response.data.choices[0].message.content;

    return bio;
  };

  const bio = await makeOpenAIRequest();

  totalAmountOfBiosCompleted += 1;
  console.log(`Bio genereated for ${formattedDoctor.name}`);
  event.sender.send("progress-update", {
    progress: Math.round(
      (totalAmountOfBiosCompleted / totalAmountOfBiosNeeded) * 100
    ),
  });

  return bio;
};

const generateBios = async (exportFile, openai, directoryPath, event) => {
  const doctors = await readInputFromCSV(exportFile);
  doctors.shift();
  totalAmountOfBiosNeeded = doctors.length * 2;

  // Set up the rate limiter
  const averageTokensPerRequest = 410; // Change this based on your average tokens per request
  const minTime = (60 / (90000 / averageTokensPerRequest)) * 1000;

  const limiter = new Bottleneck({
    minTime, // Number of milliseconds to wait between API calls
    maxConcurrent: 3000, // Maximum concurrent requests
  });

  // Loop through doctors and create all bio generation promises
  const bioPromises = doctors.map((doctor) =>
    limiter.schedule(() => generateBio(doctor, openai, event))
  );

  // Wait for all promises to resolve
  const bios = await Promise.all(bioPromises);

  // Combine the doctors with their bios
  combineDoctorsAndBios(doctors, bios, directoryPath);

  return;
};

ipcMain.handle("open-file-dialog-for-csv", async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (!result.canceled) {
    return result.filePaths[0];
  } else {
    return null;
  }
});

ipcMain.handle("run-generation", async (event, data) => {
  const { apiKey, exportFilePath, directoryPath } = data;

  const configuration = new Configuration({
    apiKey,
  });

  const openai = new OpenAIApi(configuration);

  await generateBios(exportFilePath, openai, directoryPath, event);

  return { status: "completed" };
});

ipcMain.on("open-csv-file", (event, filePath) => {
  shell.openPath(filePath);
});

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 520,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  // and load the index.html of the app.
  // win.loadFile("index.html");
  // `file://${path.join(__dirname, "../build/index.html")}`
  win.loadURL("http://localhost:3000");
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
