# E-Learning Website with AI doubt assistance support

This full-stack E-learning website allows tutors to upload courses and students to purchase them. Students can get doubt support by asking questions in a Q&A forum or through an AI assistant. The AI is trained on course transcripts to provide accurate answers specifically related to the course material. The website also offers real-time analytics for course insights and DRM protection for video content.

Check link - https://elearning-front-end.vercel.app/

## 🔋Core Features

1.  Real-time student course purchase analytics on the admin dashboard.
2.  Upload video of the course and generate its transcript.
3.  Use the transcript of the video to train and fine tune the AI model.
4.  Student QNA , course purchase and review instant notification on Admin Dashboard.

## 👉Project Screen Shots -

### E-learning AI BOT🤖 -![ASKAI](https://github.com/yghugardare/Elearning/assets/117991996/28c98cab-d59e-47bd-a7be-236be0afabc9)

![EnterVideoName](https://github.com/yghugardare/Elearning/assets/117991996/fc4e52e0-c735-48e7-8a1b-ffe70d7698ea)
With video transcript -
![withTrs](https://github.com/yghugardare/Elearning/assets/117991996/72e3a468-5f13-4025-9a3d-aa35610ba450)
without transcript in light mode[just to show ui🌞] -
![w/otrs](https://github.com/yghugardare/Elearning/assets/117991996/7815ad92-59bf-417f-bf65-d42beda142d5)

### Upload video to AI ⬆️-

![addToAi](https://github.com/yghugardare/Elearning/assets/117991996/5b0a643d-6c27-4416-9ab6-533082bad44b)
Video to Transcript , Transcript sent to model
![trs](https://github.com/yghugardare/Elearning/assets/117991996/5af55374-79f4-4b2a-8233-3e8c243b2a8b)

### Real Time Analytics 📈-

Order,Course and User Analytics [*used Re-charts*]-
![order](https://github.com/yghugardare/Elearning/assets/117991996/fae6490f-60b4-4816-b362-00ff3b9f25bb)
![c ourse](https://github.com/yghugardare/Elearning/assets/117991996/2e46a18d-98a8-42dc-9f22-d7851ccbdfa0)
![user](https://github.com/yghugardare/Elearning/assets/117991996/ae648336-6729-4a99-b7df-7317e61757eb)

### Instant Notification🔔 -

![notif](https://github.com/yghugardare/Elearning/assets/117991996/65eca2e6-052b-418a-b16a-c574a09e3f61)

## 🎯Problem It Solves

- Empowers students with multiple channels for resolving doubts and deepening course understanding.
- Provides teachers with an AI-powered tool to manage questions and offer more personalized support.
- Offers analytics to help instructors track student progress and identify areas for improvement.
- Protects Tutors content rights by providing **DMR[Digital Media Rights]** Encryption.

## ⚙️Tech Stack

<img src="https://skillicons.dev/icons?i=nextjs,redux,materialui,tailwind,vercel,ts,express,mongo,redis,docker" />

### 🧑‍💻Language -

Typescript![Ts](https://img.shields.io/badge/-TypeScript-blue?logo=typescript&logoColor=white)

### 🎨Front-end -

- **NextJS 14:** Powerful React framework for server-side rendering, performance, and developer experience.
- **Tailwind CSS:** Utility-first CSS framework for rapid styling and customization.
- **Material UI:** Library of pre-built React components based on Google's Material Design.
- **Recharts:** Declarative charting library for creating visualizations.
- **socket.io-client:** Enables real-time bidirectional communication between client and server.
- **vdoCipher:** DRM service for securing video content.
- **Redux Toolkit Query:** Simplifies data fetching and management in Redux applications.
- **@google/generative-ai:** Integration with Google's Generative AI LLM for AI assistance.
- **NextAuth:** Streamlines social authentication.
- **Formik & Yup:** Robust form creation and validation tools.
- **@stripe/react-stripe-js:** Facilitates Stripe payment processing on the frontend.

### 🗄️Backend -

- **Express:** Node.js web framework for building APIs and server-side logic.
- **Nodemailer & EJS:** Facilitate email sending for notifications and user interactions.
- **Cloudinary & Multer:** Image and file storage/upload management.
- **Stripe:** Secure payment gateway integration.
- **MongoDB & Mongoose:** Flexible NoSQL database with an object modeling layer.
- **Redis:** In-memory data structure store for high-performance caching.
- **socket.io:** Real-time communication engine for backend-client interaction.
- **bcrypt & JWT:** Secure password hashing and JSON web token authentication.

### 📹Video To Text📜 -

- **Streamlit:** Creating an interactive and user-friendly web interface.
- **FFMPEGL** Video to Audio Conversion
- **AssemblyAI:** Ensuring high accuracy in speech-to-text conversion.
- **Docker:** Making the app portable and easy to manage across platforms.

## 🤸Quick Start

Follow these steps to set up the project locally on your machine.

**Prerequisites**

Make sure you have the following installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/) (Node Package Manager)

**Cloning the Repository** -

    git clone https://github.com/yghugardare/Elearning.git

**Installation**

Install the project dependencies using npm:
At client side

    cd client
    npm i

At server side -

    cd server
    npm i

**Set Up Environment Variables**

Create a new file named `.env` in the root of your client and server folder and add the content from `env.sample` file

**Running the Project**
At client side

    cd client
    npm run dev

At server side -

    cd server
    npm run dev

Client will run at - [http://localhost:3000](http://localhost:3000/)

Server will run ar - [http://localhost:8000](http://localhost:8000/)

---
