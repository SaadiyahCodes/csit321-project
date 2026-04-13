# Gusto by Team InnoVision
Capstone Project README File

## Youtube Demo Link
https://youtu.be/0LE3cTJYHuc

## Tech Stack

- Backend: FastAPI, PostgreSQL (NeonDB), SQLAlchemy, Alembic
- Frontend: React, Vite, Tailwind CSS, React Router
- AI: Gemini (google-genai)
- Translation: Google Cloud Translate + Gemini for food context
- Voice: SpeechRecognition + gTTS + pydub + FFmpeg
- Deployment: Render (backend) + Vercel (frontend) + NeonDB

## Deployed URLs

Backend: https://gusto-ae.onrender.com <br/>
Frontend: https://gusto-ae.vercel.app

---

## Project Overview

**Gusto** is a multi-restaurant platform providing the CX layer before customers order. 

It allows customers to switch between **languages** (translated with food context), ask any queries with a **chatbot** in natural language such as **allergens/dietary preferences** to get safe recommendations, order by **voice or text**, and use **Augmented Reality** to view dish presentation and portion size.

We also provide an additional layer of intelligence through our **analytics dashboard**. These analytics are based on customer-chatbot conversations and can drive menu optimization and smarter customer recommendations.

---

## Installation Guide

**Pre-requirements**

Ensure the following are installed:

* Git
* Python
* Node or Node Version Manager (nvm)

Note: It is better to install nvm from https://github.com/coreybutler/nvm-windows/releases. You may also directly install the latest stable version compatible with Vite.

---

### Setup

Once you run `git pull`, do the following steps:

#### In `/backend`:

* create a .env file to store api keys
* create python virtual environment `python -m venv venv`
* activate environment

  * For Windows: `venv\Scripts\activate`
  * For MacOS/Linux: `source venv/bin/activate`
* Install dependencies `pip install -r requirements.txt`
* Install `ffmpeg`

  * Windows: `winget install ffmpeg`
  * Linux: `sudo apt-get install ffmpeg`
  * Mac: `brew install ffmpeg`
* Run backend server `uvicorn app.main:app --reload`

#### In `/frontend`:

We are using React + Vite

* run `npm install` (as npm will not be tracked by Git and has to be recreated from your package.json locally)
* start frontend server `npm run dev`

<br/>

## Troubleshooting Guide

* always ensure `_pycache_`, `node_modules` and `.env` files are written in your `.gitignore`. If `.gitignore` is at root level, it applies to all files in subdirectories too.

* While activating the python venv, if it says system admin does not allow scripts to run, use temporary measures to bypass the settings. This must be run each session:
  `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

### Changing Python Versions

If you're using an outdated version (3.10.11) and want to switch python versions (to for example 3.12.1):

* Download version from python.org
* Delete existing `venv` folder and run `deactivate` in terminal if activated
* Change to backend directory: `cd backend`
* Create a new venv using python 3.12: `py -3.12 -m venv venv`
* Activate venv and ensure python version shows 3.12.1 (`python --version`)
* (optional) upgrade pip if needed `python -m pip install --upgrade pip`
* run `pip install -r requirements.txt` (latest file)

---

### Summary

Gusto's goal is to enable everyone to dine, regardless of their dietary preferences, language barriers or accessibility needs.
