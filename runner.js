const express = require("express");
const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(bodyParser.json());

app.get("/health", (req, res) => res.send("Python Runner OK"));

app.post("/execute", async (req, res) => {
  const { code, input } = req.body;
  if (!code) return res.status(400).json({ error: "No code provided" });

  const fileName = "main.py";
  const filePath = path.join(__dirname, fileName);
  fs.writeFileSync(filePath, code);

  const start = Date.now();
  let stdout = "";
  let stderr = "";
  let isTimedOut = false;

  // Run Python
  const child = spawn("python3", [fileName], { cwd: __dirname });

  if (input) {
    child.stdin.write(input);
    child.stdin.end();
  }

  child.stdout.on("data", (data) => (stdout += data.toString()));
  child.stderr.on("data", (data) => (stderr += data.toString()));

  // Timeout Logic (10s)
  const timeout = setTimeout(() => {
    isTimedOut = true;
    child.kill("SIGKILL");
  }, 10000);

  child.on("close", (code) => {
    clearTimeout(timeout);
    const duration = Date.now() - start;

    fs.unlink(filePath, () => {}); // Cleanup

    if (isTimedOut) {
      return res.json({
        status: "TIMEOUT",
        output: stdout,
        error: "Execution time limit exceeded",
        executionTime: 10000,
      });
    }

    res.json({
      status: code === 0 ? "COMPLETED" : "FAILED",
      output: stdout,
      error: stderr,
      exitCode: code,
      executionTime: duration,
    });
  });
});

app.listen(PORT, () => console.log(`Python Runner on ${PORT}`));
