# 🎯 KCET MCQs Practice Platform

A full-stack web application designed to help Karnataka Common Entrance Test (KCET) aspirants practice Multiple Choice Questions (MCQs) in an interactive and efficient manner.

The platform provides topic-wise practice, instant feedback, score evaluation, and a user-friendly interface to enhance exam preparation. Questions are managed dynamically through MongoDB, making the application scalable and easy to maintain.

---

## 🌐 Live Demo

🔗 https://kce-tmcqs.vercel.app/

---

## 📌 Overview

KCET is one of the most important entrance examinations for students seeking admission to engineering and other professional courses in Karnataka.

This platform was developed to provide students with an accessible and engaging way to practice MCQs, improve accuracy, and strengthen conceptual understanding through continuous self-assessment.

The application allows users to attempt questions, receive immediate feedback, and evaluate their performance in real time.

---

## ✨ Features

- 📚 Topic-wise MCQ Practice
- ⚡ Instant Answer Validation
- 📊 Real-Time Score Calculation
- 📱 Responsive Design
- 🌐 Online Accessibility
- 🗄️ MongoDB Database Integration
- 🔄 Dynamic Question Retrieval
- 🚀 Fast and Lightweight User Interface
- 🎯 Exam-Oriented Practice Environment
- 💻 Cross-Platform Compatibility

---

## 🛠️ Tech Stack

### Frontend
- React.js
- HTML5
- CSS3
- JavaScript (ES6+)

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### Deployment
- Vercel

### Version Control
- Git
- GitHub

---

## 🏗️ System Architecture

```text
User
  │
  ▼
React Frontend
  │
  ▼
Express API Server
  │
  ▼
MongoDB Database
  │
  ▼
Question Retrieval & Validation
```

---

## 📂 Project Structure

```text
KCETmcqs/
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── server.js
│
├── package.json
├── README.md
└── .gitignore
```

*Folder names may vary slightly depending on implementation.*

---

## 🚀 Installation

### Clone the Repository

```bash
git clone https://github.com/dishaprabhakar2006-blip/KCETmcqs.git
```

### Navigate to Project Directory

```bash
cd KCETmcqs
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

### Start Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

---

## ⚙️ How It Works

1. Questions are stored in MongoDB.
2. The backend retrieves questions through API endpoints.
3. The React frontend displays questions dynamically.
4. Users attempt MCQs and submit answers.
5. Responses are evaluated instantly.
6. Scores are calculated and displayed.
7. Users can continue practicing to improve performance.

---

## 🎯 Objectives

- Make KCET preparation more accessible.
- Encourage active learning through practice.
- Improve question-solving speed and accuracy.
- Provide a smooth and engaging user experience.
- Create a scalable educational platform.

---

## 📊 Key Functionalities

### Question Management
- Store MCQs in MongoDB
- Retrieve questions dynamically
- Organize questions efficiently

### User Experience
- Clean and intuitive interface
- Fast page loading
- Mobile responsiveness

### Performance Evaluation
- Instant feedback
- Score tracking
- Self-assessment support

---

## 🔮 Future Enhancements

- User Authentication
- Student Profiles
- Progress Tracking Dashboard
- Subject-wise Analytics
- Bookmark Questions
- Leaderboards
- Full-Length Mock Tests
- Performance Reports
- Difficulty-Level Filtering
- Dark Mode Support

---

## 🎓 Learning Outcomes

This project helped in gaining practical experience with:

- Full-Stack Web Development
- React Component Architecture
- REST API Development
- Database Design using MongoDB
- Backend Development with Express.js
- Deployment and Hosting
- Git & GitHub Workflow
- Problem Solving and Debugging

---

## 👩‍💻 Author

### Disha P

🔗 GitHub  
https://github.com/dishaprabhakar2006-blip

🔗 LinkedIn  
https://www.linkedin.com/in/disha-p-46668232b/

---

## 🌟 Highlights

- Full-Stack Application
- Real-World Educational Use Case
- MongoDB Database Integration
- Public Deployment
- Responsive Design
- Scalable Architecture
- Student-Centric Platform

---

## 📄 License

This project is developed for educational and learning purposes.
