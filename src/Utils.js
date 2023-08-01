const csvParser = require("csv-parser");
const fs = require("fs");
const csvStringify = require("csv-stringify");
const pdfParse = require("pdf-parse");

const extractFirstThreeItems = (inputString) => {
  const items = inputString.split(",").map((item) => item.trim());
  const firstThreeItems = items.slice(0, 3).join(", ");
  return firstThreeItems;
};

const convertArrayToObject = (inputArray) => {
  const result = {};

  // Name
  result.name = `${inputArray[1]} ${inputArray[2] ? inputArray[2] + "." : ""} ${
    inputArray[3]
  }${inputArray[4] ? ", " + inputArray[4] : ""}${
    inputArray[5] ? ", " + inputArray[5] : ""
  }`;

  // Specialties
  const specialties = [];
  for (let i = 78; i <= 88; i++) {
    if (inputArray[i]) {
      specialties.push(inputArray[i]);
    }
  }
  result.specialties = specialties.join(", ");

  // Interests
  const interests = [];
  for (let i = 67; i <= 77; i++) {
    if (inputArray[i]) {
      interests.push(inputArray[i]);
    }
  }
  result.interests = interests.join(", ");

  // Affiliations
  result.affiliations = inputArray[13];

  // Gender
  result.gender = inputArray[6] === "M" ? "Male" : "Female";

  // Languages
  // Assuming the default language is English if none is provided
  const languages = [];
  for (let i = 77; i <= 80; i++) {
    if (inputArray[i]) {
      languages.push(inputArray[i]);
    }
  }
  if (!result.languages) languages.push("English");
  result.languages = languages.join(", ");

  // Certifications
  const certs = [];
  for (let i = 62; i <= 66; i++) {
    if (inputArray[i]) {
      certs.push(inputArray[i]);
    }
  }
  result.certs = certs.join(", ");

  // Medical School
  result.medicalSchool = `${inputArray[92]}, ${inputArray[93]}, ${inputArray[94]}, ${inputArray[95]}`;

  // Fellowships
  const fellowships = [];
  for (let i = 111; i <= 114; i += 2) {
    if (inputArray[i]) {
      fellowships.push(inputArray[i]);
    }
  }
  result.fellowships = fellowships.length ? fellowships.join(", ") : "";

  // Fellowships
  const residency = [];
  for (let i = 107; i <= 110; i += 2) {
    if (inputArray[i]) {
      residency.push(inputArray[i]);
    }
  }
  result.residency = residency.length ? residency.join(", ") : "";

  // Clinical Titles
  const clinicalTitles = [];
  for (let i = 115; i <= 116; i++) {
    if (inputArray[i]) {
      clinicalTitles.push(inputArray[i]);
    }
  }
  result.clinicalTitles = clinicalTitles.join(" | ");

  // Academic Titles
  result.academicTitles = inputArray[114];

  return result;
};

const readInputFromCSV = (filename) => {
  return new Promise((resolve, reject) => {
    let results = [];
    fs.createReadStream(filename)
      .pipe(csvParser({ headers: false }))
      .on("data", (data) => results.push(Object.values(data)))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

const withTimeout = (promise, ms) => {
  let timer;
  return Promise.race([
    promise,
    new Promise((_r, reject) => {
      timer = setTimeout(() => {
        reject(new Error("Request timed out"));
      }, ms);
    }),
  ]).finally(() => clearTimeout(timer));
};

const combineDoctorsAndBios = (doctors, bios, directoryPath) => {
  let docsAndBios = [["NPI Number", "Name", "Bio"]];

  for (let i = 0; i < doctors.length; i++) {
    const npiNumber = doctors[i][0];

    const doctorName = `${doctors[i][1]} ${
      doctors[i][2] ? doctors[i][2] + "." : ""
    } ${doctors[i][3]}${doctors[i][4] ? ", " + doctors[i][4] : ""}${
      doctors[i][5] ? ", " + doctors[i][5] : ""
    }`;

    const bio = bios[i];

    docsAndBios.push([npiNumber, doctorName, bio]);
  }

  csvStringify.stringify(docsAndBios, (err, output) => {
    fs.writeFileSync(`${directoryPath}/output.csv`, output);
    console.log(`Output written to ${directoryPath}/output.csv`);
  });

  return docsAndBios;
};

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const readCVFromFile = async (filename) => {
  let dataBuffer = fs.readFileSync(filename);
  let pdfContent;

  try {
    pdfContent = await pdfParse(dataBuffer);
  } catch (error) {
    console.error(`Error fetching PDF from ${filename}`);
  }

  return pdfContent.text;
};

module.exports = {
  convertArrayToObject,
  readInputFromCSV,
  withTimeout,
  combineDoctorsAndBios,
  capitalizeFirstLetter,
  readCVFromFile,
  extractFirstThreeItems,
};
