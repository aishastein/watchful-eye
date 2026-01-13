# 🦅 ProctorAI: The Watchful Eye
### **"Integrity through Innovation"**

Welcome to **ProctorAI**, a state-of-the-art, privacy-first AI proctoring system designed to ensure academic integrity without compromising user privacy. Built by **Team Titans**, this project turns a standard webcam into a high-precision monitoring tool.

---

## 🚀 The Mission
In the world of online exams, trust is everything. ProctorAI uses cutting-edge computer vision to monitor student behavior in real-time, detecting everything from unauthorized guests to "suspicious" eye movements—all while processing data **locally on the device.**

---

## ✨ Key Features

- 👤 **Face Recognition & Tracking**: Detects if the student is present and sounds the alarm if more than one person enters the frame.
- 📐 **Head Pose Estimation**: Analyzes 3D head rotation. If a student looks away from the screen for too long, it’s logged as an incident.
- 👁️ **Eye Gaze Analysis**: Tracks whether eyes are focused on the exam or wandering toward "external resources."
- 🎙️ **Audio Surveillance**: Monitors background noise and detects talking using real-time decibel analysis.
- 📊 **Dynamic Suspicion Score**: A real-time severity-weighted score that tells the examiner exactly how "unusual" the behavior is.
- 🛡️ **Privacy First**: No video is ever sent to a server. All AI processing happens right in the student's browser.
- 🌑 **Premium UI**: A sleek, dark-mode "Glassmorphic" interface that feels like a mission control center.

---

## 🛠 Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React + Vite** | High-performance frontend framework |
| **MediaPipe** | Google's elite AI models for Face & Gaze detection |
| **Tailwind CSS** | Styling & UI responsiveness |
| **Lucide Icons** | Beautiful, minimal iconography |
| **Supabase** | Backend infrastructure for secure data logging |

---

## 📦 Installation & Setup

Want to run the Watchful Eye on your local machine? Follow these steps:

1. **Clone the Repo**
   ```bash
   git clone https://github.com/aishastein/watchful-eye.git
   ```

2. **Install Dependencies** (Get the engine ready)
   ```bash
   npm install
   ```

3. **Set Up Environments**
   Create a `.env` file in the root and add your Supabase credentials (see `.env.example`).

4. **Launch the Engine**
   ```bash
   npm run dev
   ```

5. **Access the Portal**
   Open `http://localhost:5173` in your browser.

---

## 💻 How to Use

1. **Grant Permission**: Click "Start Session" and allow camera/microphone access.
2. **Calibration**: Ensure your face is centered. You'll see the **Green Mesh** confirm detection.
3. **The Test**: Try looking at your phone or inviting a friend into the frame—watch how the system reacts!
4. **Examiner Mode**: Toggle the switch in the top right to see the analytics dashboard.

---

## 🔐 Privacy & Ethics
ProctorAI was built with the belief that proctoring shouldn't be "Spyware." 
- ✅ **No Cloud Video Storage**
- ✅ **Transparent Violation Logging**
- ✅ **Local AI Inference**

---

## 👥 The Team
Built with Passion by **Team Titans** 🛠️

- **Aisha** (Lead Architect)
- **Titans Team** (The Force behind the Logic)

---

> *"The eye that never sleeps, the integrity that never fails."* 🦅
