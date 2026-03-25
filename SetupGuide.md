## Installation Guide

**Pre-requirements:**
Ensure the following are installed
- Git
- Python
- Node or Node Version Manager (nvm)
    Note: It is better to install nvm from [here](https://github.com/coreybutler/nvm-windows/releases). You may also directly install the latest stable version **compatible with Vite**.

**Setup**:

Once you run `git pull` , do the following steps:
- in `/backend`:
    - create a .env file to store api keys
    - create python virtual environment `python -m venv venv`
    - activate environment <br>
    For Windows: `venv\Scripts\activate` <br>
    For MacOS/Linux: `source venv/bin/activate`
    - Install dependencies `pip install -r requirements.txt`
    - Install `ffmpeg`
        - Windows: `winget install ffmpeg`
        - Linux: `sudo apt-get install ffmpeg`
        - Mac: `brew install ffmpeg`
    - Run backend server `uvicorn app.main:app --reload`
- in `\frontend`: <br>
    We are using React + Vite
    - run `npm install` (as npm will not be tracked by Git and has to be recreated from your package.json locally)
    - start frontend server `npm run dev`

## Troubleshooting Guide
- always ensure `_pycache_`, `node_modules` and `.env` files are written in your `.gitignore`. If `.gitignore` is at root level, it applies to all files in subdirectories too.

- While activating the python venv, if it says system admin does not allow scripts to run, use temporary measures to bypass the settings. This must be run each session. `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

1. **Problem: `http://127.0.0.1:8000/` does not show `{"message":"Welcome to Gusto API"}` even after running uvicorn**

Run `netstat -ano | findstr :8000` and kill any process running on the same port.

### Changing Python Versions
If you're using an outdated version (3.10.11) and want to switch python versions (to for example 3.12.1)

- Download version from python.org
- Delete existing `venv` folder and run `deactivate` in terminal if activated.
- Change to backend directory: `cd backend`
- Create a new venv using python 3.12: `py -3.12 -m venv venv`
- Activate venv and ensure python version shows 3.12.1 (`python --version`)
- (optional) upgrade pip if needed `python -m pip install --upgrade pip`
- run `pip install -r requirements.txt` (latest file)

### **Note**: Whenever you're installing a new library, add the name to `requirements.txt` manually. 
You may also additionally run `pip freeze >> requirements.lock` to update the lock file which will have the exact versions listed (for debugging) but should **not** be installed from in your venv.