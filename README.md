

# **🧠 Mentality - Your Personalized Mental Health Companion**  

### **A mental health platform offering psychologist support, resources, video calls, chat, and progress tracking.**  

---

## **🚀 Features**  
- **User Authentication**: Secure login and signup with email verification.  
- **Profile Completion**: Users must complete their profile to access psychologists.  
- **Mood Tracking & Survey**: Personalized content suggestions based on user input.  
- **Resource Hub**: Mental health articles categorized by topics.  
- **Chat System**: Real-time messaging with psychologists.  
- **Video Call Support**: Instant video sessions with psychologists.  
- **Payment Integration**: Secure transactions via **Stripe** for sessions.  
- **Admin Dashboard**: Manage users, psychologists, and resources.  
- **Responsive UI**: Fully optimized for mobile and desktop.  

---

## **📸 Screenshots**  
![image](https://github.com/user-attachments/assets/d2e6c03a-9cf3-4aad-8f39-c12893815f8b)


---

## **🛠️ Tech Stack**  

### **Frontend:**  
- **Next.js** - Full-stack framework  
- **Tailwind CSS** - Styling framework  

### **Backend:**  
- **Next.js API Routes** - Server-side functions  
- **MongoDB Atlas** - NoSQL Database  
- **Mongoose** - Database ODM  
- **WebRTC & Peer.js** - Video Calling  
- **Socket.io** - Real-time Chat  

### **Authentication & Security:**  
- **JWT & Cookies** - Session management  
- **Bcrypt.js** - Password hashing  
- **NextAuth.js (optional)** - Third-party login  

### **Payments & Transactions:**  
- **Stripe API** - Secure payments for psychologist sessions  

---

## **⚙️ Installation & Setup**  

### **1️⃣ Clone the Repository**  
```sh
git clone https://github.com/yourusername/mentality.git
cd mentality
```

### **2️⃣ Install Dependencies**  
```sh
npm install
# or
yarn install
```

### **3️⃣ Set Up Environment Variables**  
Create a `.env.local` file in the root directory and add the following:  
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_CLOUDINARY_URL=your_cloudinary_url
```

### **4️⃣ Start the Development Server**  
```sh
npm run dev
# or
yarn dev
```
The app will be running on `http://localhost:3000`

---


## **📌 Contributing**  
1. **Fork the Repository**  
2. **Create a Feature Branch** (`git checkout -b feature-name`)  
3. **Commit Changes** (`git commit -m "Add new feature"`)  
4. **Push to Branch** (`git push origin feature-name`)  
5. **Create a Pull Request**  

---

## **📜 License**  
This project is **open-source** under the **MIT License**.  

---


🚀 **Built with ❤️ by [Arpan Lama Karki]**  

---
