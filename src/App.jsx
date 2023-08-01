import { useState, useEffect } from "react";
import LoadingBar from "./components/LoadingBar";
import ummhLogo from "./images/ummhLogo.png";

function App() {
  const [directoryPath, setDirectoryPath] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [exportFile, setExportFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [jobFinished, setJobFinished] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const { ipcRenderer } = window.require("electron");

    // Listen for progress updates
    ipcRenderer.on("progress-update", (event, data) => {
      setProgress(data.progress);
    });

    return () => {
      // Remove the listener when the component unmounts
      ipcRenderer.removeAllListeners("progress-update");
    };
  }, []);

  const openCSV = () => {
    const { ipcRenderer } = window.require("electron");
    ipcRenderer.send("open-csv-file", `${directoryPath}/output.csv`);
  };

  const openFileDialog = async () => {
    const { ipcRenderer } = window.require("electron");
    const path = await ipcRenderer.invoke("open-file-dialog-for-csv");
    setDirectoryPath(path);
  };

  const runGeneration = async () => {
    if (
      !directoryPath ||
      !apiKey ||
      !exportFile ||
      directoryPath === undefined ||
      exportFile === undefined ||
      apiKey === undefined
    )
      return alert("Please fill out all fields.");

    setLoading(true);
    const { ipcRenderer } = window.require("electron");
    await ipcRenderer.invoke("run-generation", {
      apiKey,
      exportFilePath: exportFile ? exportFile.path : null,
      directoryPath,
    });
    setLoading(false);
    setJobFinished(true);
    setProgress(0);
  };

  if (jobFinished)
    return (
      <div className="App flex gap-8">
        <div className="bg-[#10069f] hidden md:block text-white m-4 rounded-lg p-10 max-w-xs">
          <img src={ummhLogo} alt="" />
          {/* <p className="text-sm font-bold">FAD Bio Generator</p> */}
          <h1 className="text-2xl font-bold mt-4">How to use this program</h1>

          <ul className="mt-3 list-disc">
            <li>
              First, enter in your API Key. This can be found and generated in
              your OpenAI account.
            </li>
            <li className="mt-2">
              Then, select an input file. This will usually be the daily export
              sent to Press Ganey.
            </li>
            <li className="mt-2">
              Third, select an output directory for where you want to store the
              results.
            </li>
            <li className="mt-2">Finally, press run generate!</li>
          </ul>
        </div>
        <div className="mt-4 mx-auto md:mx-0 w-96">
          <h1 className="font-bold text-2xl">Find-A-Doctor Bio Generator</h1>
          <p className="text-sm text-gray-500">
            By Digital Services Intern{" "}
            <a
              href="https://www.linkedin.com/in/cyrus-guest-3a3b6a258/"
              target="_blank"
              rel="noreferrer"
              className="underline font-bold text-[#10069f]"
            >
              Cyrus Guest
            </a>
          </p>

          <h1 className="text-xl font-bold mt-6">Generation completed</h1>
          <button
            className="rounded-lg w-full shadow-lg p-3 mt-1 bg-[#10069f] text-white font-bold hover:bg-white hover:text-[#10069f] transition-all duration-200"
            onClick={openCSV}
          >
            View results
          </button>

          <p
            onClick={() => {
              setJobFinished(false);
              setExportFile(null);
              setApiKey("");
              setDirectoryPath("");
              setProgress(0);
            }}
            className="cursor-pointer underline mt-2 text-sm text-gray-500"
          >
            Click here to restart.
          </p>
        </div>
      </div>
    );

  return (
    <div className="App flex gap-8">
      <div className="bg-[#10069f] hidden md:block text-white m-4 rounded-lg p-10 max-w-xs">
        <img src={ummhLogo} alt="" />
        <h1 className="text-2xl font-bold mt-4">How to use this program</h1>

        <ul className="mt-3 list-disc">
          <li>
            First, enter in your API Key. This can be found and generated in
            your OpenAI account.
          </li>
          <li className="mt-2">
            Then, select an input file. This will usually be the daily export
            sent to Press Ganey.
          </li>
          <li className="mt-2">
            Third, select an output directory for where you want to store the
            results.
          </li>
          <li className="mt-2">Finally, press run generation!</li>
        </ul>
      </div>
      <div className="mt-4 mx-auto md:mx-0 w-96">
        <h1 className="font-bold text-2xl">Find-A-Doctor Bio Generator</h1>
        <p className="text-sm text-gray-500">
          By Digital Services Intern{" "}
          <a
            href="https://www.linkedin.com/in/cyrus-guest-3a3b6a258/"
            target="_blank"
            rel="noreferrer"
            className="underline font-bold text-[#10069f]"
          >
            Cyrus Guest
          </a>
        </p>

        {loading ? (
          <div>
            <LoadingBar percentage={progress.toFixed(2)} />
          </div>
        ) : (
          <form className="flex flex-col max-w-md mt-4 md:mx-auto">
            <label className="font-bold" htmlFor="apikey">
              OpenAI API Key:
            </label>
            <input
              className="outline-none placeholder-white border-none shadow-lg rounded-lg p-2 mt-1 text-white bg-[#10069f] focus:bg-white focus:text-[#10069f] focus:placeholder-[#10069f] transition-all duration-200"
              type="text"
              placeholder="API Key"
              onChange={(e) => setApiKey(e.target.value)}
              value={apiKey}
            />

            <label className="font-bold mt-8" htmlFor="export">
              Select the daily export file for input
            </label>
            <input
              className="mt-1"
              type="file"
              onChange={(e) => setExportFile(e.target.files[0])}
            />

            <label className="font-bold mt-8" htmlFor="export">
              Output directory:{" "}
              <span className="truncate text-[#10069f] font-normal">
                {directoryPath}
              </span>
            </label>
            <button
              className="rounded-lg p-3 mt-1 shadow-lg bg-[#10069f] text-white font-bold hover:bg-white hover:text-[#10069f] transition-all duration-200"
              onClick={openFileDialog}
              type="button"
            >
              Select directory
            </button>

            <button
              className="shadow-lg font-bold rounded-lg p-3 mt-5 bg-[#10069f] text-white hover:bg-white hover:text-[#10069f] transition-all duration-200"
              type="submit"
              onClick={runGeneration}
            >
              Run Generation
            </button>

            <p className="text-sm text-gray-500 text-center mt-3">
              Running this program will charge OpenAI account.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;
