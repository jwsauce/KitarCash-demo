## 👥Team Introduction

### Team Name: HayDay HeyHey
### Project Name: KitarCash
### Members
1. Chia Chin Tian
2. Chong Jin Wei
3. Tan Sher Yi
4. Yew Tien Sze
---

## 📁 Repository Overview

### 1. File & Folder Structure
```
KitarCash-demo/
│
├── 📄 index.html                    ← Single-page app HTML shell
├── 📄 index.tsx                     ← React entry point (mounts App into HTML)
├── 📄 App.tsx                       ← Root component + all route definitions
├── 📄 firebase.ts                   ← Firebase SDK initialization (auth, db, storage)
├── 📄 types.ts                      ← TypeScript data structure contracts
├── 📄 package.json                  ← Dependencies and npm scripts
├── 📄 vite.config.ts                ← Build tool configuration
├── 📄 tsconfig.json                 ← TypeScript compiler settings
├── 📄 firebase.json                 ← Firebase services configuration
├── 📄 firestore.rules               ← Database security rules (who can read/write)
└── 📄 firestore.indexes.json        ← Firestore compound query indexes
│
├── 📂 pages/                        ← FRONTEND — Full-page views (one per user role)
│   ├── GettingStarted.tsx           ← Landing page + login/signup
│   ├── UserDashboard.tsx            ← Main user interface (chatbot/pickup/wallet tabs)
│   ├── CenterDashboard.tsx          ← Recycling center QR scanner + verification
│   ├── DriverDashboard.tsx          ← Driver pickup marketplace
│   └── AdminDashboard.tsx           ← Admin management (future)
│
├── 📂 components/                   ← FRONTEND — Reusable UI building blocks
│   ├── Chatbot.tsx                  ← AI chatbot + image upload + text chat
│   ├── Wallet.tsx                   ← Wallet balance + QR code + transaction history
│   ├── PickupScheduler.tsx          ← Pickup form + pooling logic + real-time status tracker
│   ├── MapComponent.tsx             ← Google Maps embed with user + center markers
│   ├── Header.tsx                   ← Tab navigation for user dashboard
│   ├── ProtectedRoute.tsx           ← Role-based route guard (checks JWT before rendering)
│   ├── ConfirmationModal.tsx        ← Reusable confirmation dialog
│   ├── DataSafetyGuide.tsx          ← Data wiping guide for phones/laptops
│   ├── HazardWarning.tsx            ← Hazard warning for dangerous e-waste items
│   ├── IconComponents.tsx           ← SVG icon components (Camera, Truck, Cash, etc.)
│   └── auth/
│       └── AuthCard.tsx             ← Login/Signup form component
│
├── 📂 context/                      ← FRONTEND — Global state management
│   └── AuthContext.tsx              ← Auth state (user, role, centerId, login, logout)
│
├── 📂 services/                     ← FRONTEND — Business logic + external API calls
│   ├── geminiService.ts             ← Google Gemini AI: image analysis + text chat
│   ├── firestoreService.ts          ← Firestore CRUD + pooling algorithm + cancel request
│   ├── emailService.ts              ← EmailJS pickup confirmation notifications
│   ├── storageService.ts            ← Firebase Storage image upload with progress
│   ├── geoUtils.ts                  ← Haversine distance calculation
│   └── mockData.ts                  ← Sample recycling centers for development
│
├── 📂 scripts/                      ← Utility scripts
│   └── assignCenters.ts             ← Helper to seed recycling centers into Firestore
│
├── 📂 functions/                    ← BACKEND — Firebase Cloud Functions (server-side)
│   ├── src/
│   │   └── index.ts                 ← All 5 Cloud Functions
│   ├── package.json                 ← Backend dependencies
│   └── tsconfig.json                ← Backend TypeScript config
│
└── 📂 dist/                         ← Built output (auto-generated, not committed)
```

---

### 2. Frontend & Backend Separation

| Layer | Location | Technology |
|---|---|---|
| 🖥️ Frontend | Root directory (`/pages`, `/components`, `/services`, `/context`) | React 19 + TypeScript + Vite + Tailwind CSS |
| ⚙️ Backend | `/functions` subfolder | Node.js + Firebase Admin SDK |

> KitarCash is a **monorepo** — both layers share the same repository but have separate `package.json` and `tsconfig.json` as they run in completely different environments (browser vs Google Cloud).

---

### 3. Important Directories

| Directory | Purpose |
|---|---|
| `/pages` | Full-page view per user role — `UserDashboard`, `CenterDashboard`, `DriverDashboard`, `AdminDashboard` |
| `/components` | Reusable UI pieces — `PickupScheduler`, `Chatbot`, `Wallet`, `MapComponent` |
| `/services` | Business logic + external API integrations isolated from UI — Gemini AI, Firestore pooling, EmailJS |
| `/context` | Global state via `AuthContext` — provides `user`, `role`, `login`, `logout` everywhere via `useAuth()` |
| `/functions/src` | Entire backend — 5 Cloud Functions handling transactions, wallet credits, role management |
| `firebase.ts` | Single Firebase initialization imported everywhere — `auth`, `db`, `storage` |
| `types.ts` | TypeScript contracts for `EWasteItem`, `PickupRequest` — enforced across the entire codebase |
| `firestore.rules` | Database-level security — controls exactly who can read/write which collections |

---

### 4. Backend — 5 Cloud Functions

| Function | Called By | Purpose |
|---|---|---|
| `setUserRole` | Admin | Assigns roles (`user`, `driver`, `recycling_center`) to accounts |
| `setDefaultRole` | System on signup | Automatically sets new accounts to `user` role |
| `createTransaction` | Regular users | Creates recycling transaction + QR data in Firestore |
| `cancelTransaction` | Regular users | Cancels a pending transaction |
| `verifyAndCredit` | Recycling center staff | Atomically verifies item + credits user wallet (prevents double-spend) |

---

### 5. Firestore Database Collections
```
Firestore Database
├── users/              ← User profiles, roles, wallet balances
├── transactions/       ← Recycling records (QR → verify → payment flow)
├── pickupRequests/     ← Pickup bookings, pooling status, real-time driver updates
└── recyclingCenters/   ← Center locations, lat/lng, operating hours, contact
```

---

## Project Overview: KitarCash

### 1. Problem Statement

Malaysia is currently facing a critical "E-Waste Paradox" where high public awareness fails to translate into effective action, causing both environmental degradation and economic instability. This crisis reached a breaking point with the enactment of the Absolute Prohibition on e-waste imports on February 4, 2026. With this enactment, all foreign feedstock has been cut off entirely, meaning Malaysia’s 157+ licensed recovery facilities must now rely solely on e-waste generated within Malaysia to survive.

However, the current system is fundamentally broken. When a citizen wants to recycle, they are forced into a complicated and inconvenient process: they must manually research their device types, find a registered collection center, and travel there themselves—often without knowing if they will receive any incentives for their effort. This lack of motivation and high logistical friction results in millions of devices being thrown away, even though Malaysia is estimated to generate 24.5 million units of e-waste in 2025 alone.

### 2. SDG Alignment

Our solution is strategically mapped to three United Nations Sustainable Development Goals:

SDG 12 (Responsible Consumption & Production) - Target 12.5 & 12.4: We aim to substantially increase recycling rates by breaking the "Inconvenience Barrier" and ensuring hazardous materials are managed through professional, environmentally sound lifecycles.

SDG 9 (Industry, Innovation, & Infrastructure) - Target 9.4: We provide the digital infrastructure needed to modernize Malaysia’s recycling industry, securing a domestic supply chain for factories cut off from foreign imports.

SDG 11 (Sustainable Cities & Communities) - Target 11.6: We reduce the environmental impact of Malaysian cities by optimizing municipal waste management through an automated collection model.

### 3. Short Description of the Solution

KitarCash is an AI-driven logistics and incentive platform that functions as a "digital middleman" to bridge the gap in Malaysia's e-waste supply chain. Our system automates the connection between households and licensed recovery centers by providing a seamless doorstep pickup service and instant Cashback rewards. By using a smart pooling system, we transform scattered household waste into profitable industrial feedstock. Additionally, we utilize Gemini AI to guide users through secure data-wiping, ensuring that personal privacy is protected while diverting toxic chemicals from landfills into professional recycling channels.

---

## Key Features

### 🤖 AI-Powered E-Waste Identification:
Upload a photo of any e-waste item and Google Gemini 2.5 Flash instantly identifies it, estimates its recycling value in Ringgit Malaysia, flags any hazards and provides environmental impact notes. The chatbot also supports conversational Q&A for recycling-related queries.

### 🗺️ Interactive Center Map:
Google Maps displays nearby recycling centers relative to the user's live location and calculate distances between them.

### 🚚 Community Pickup Pooling:
Users can schedule a pickup instead of visiting a center. The pooling algorithm groups nearby requests within a two-kilometre radius and dispatches a single driver once the minimum quantity threshold is met.

### 💰 Real-Time Digital Wallet:
Wallet credits are issued the instant center staff verify an item. An atomic Cloud Function ensures payment and verification occur together or not at all, preventing any possibility of fraud or double-crediting.

### 📱 QR Code Transaction System:
Every recycling transaction generates a unique QR code, creating a verifiable link between the user's submission and the recycling center's physical verification. All transactions data are stored in cloud database.

### 🔒 Role-Based Access Control:
Four user roles — recycler, recycling center staff, driver, and admin — each with dedicated dashboards. Roles are embedded in Firebase JWT tokens server-side, preventing any possibility of self-assigned elevated permissions.

---

## Overview and Technologies Used

### 1. Google Technologies

| Technology | Purpose |
|---|---|
| **Firebase Authentication** | User identity management with JWT custom claims for role-based access control |
| **Firestore** | NoSQL real-time database storing users, transactions, pickup requests, and recycling center data |
| **Firebase Cloud Functions** | Serverless backend logic handling transaction creation, wallet crediting, and role assignment |
| **Firebase Cloud Storage** | Stores user-uploaded e-waste images securely |
| **Google Gemini 2.5 Flash** | Multimodal AI for e-waste image identification and conversational Q&A |
| **Google Maps JavaScript API** | Interactive map rendering with user geolocation and recycling center markers |

### 2. Supporting Tools & Libraries

| Technology | Purpose |
|---|---|
| **React 19 + TypeScript** | Frontend framework with static typing for a type-safe single-page application |
| **Vite** | Frontend build tool with fast hot module replacement during development |
| **Tailwind CSS** | Utility-first CSS framework for rapid UI styling |
| **React Router v7** | Client-side routing and protected role-based navigation |
| **qrcode.react** | QR code generation for recycling transactions |
| **html5-qrcode** | In-browser QR code scanning for recycling center staff |
| **EmailJS** | Client-side email notifications for pickup confirmations |
| **Vercel** | Frontend deployment and global CDN hosting |

---

## Implementation Details & Innovation:

## System architecture
<img width="1920" height="1080" alt="PROLEM STATEMENT" src="https://github.com/user-attachments/assets/ce1f48de-079f-47e4-bd34-ec3919e9e0be" />

KitarCash uses a serverless architecture with a React frontend deployed on Vercel, connected to Firebase/Google Cloud backend services and external APIs

### Frontend
Our frontend shows a single page application built with React 19, TypeScript, TailwindCSS, and Vite, deployed on Vercel. React 19 with TypeScript provides type-safe components and IDE autocompletion across our data models. TailwindCSS was used to rapidly prototype custom user interface with the utility-first approach. Vite provides fast hot-reload during development and optimized production builds. We deployed our website on Vercel as it is optimized for high-performance frontend hosting.  It gives us automatic deployments on every git push with zero configuration, we basically just connected our GitHub repo and it auto-detected our Vite setup. This lets us iterate rapidly during development.

Our targeted user will be regular users, driver, and recycling centers. Therefore, our web app consist of three different dashboard based on the user's role: regular users, drivers, and recycling center staff, with different features and functionalities:
### 1. 👤 User Dashboard
Consist of all the main features such as:
- AI-powered E-Waste Chatbot
- Interactive Center Map showcasing user's current location and nearby recycling centers
- Schedule Pickup Form for users to submit e-waste pickup request
- QR code generate via qrcode.react to generate QR code for e-waste transactions
- Real-Time Digital Wallet that updates when a transaction is verified and credited
### 2. 🚗 Driver Dashboard
Able to see all pickup request that is accepted after the pooling. 
Able to accept pickup request, navigate to user's location, collect e-waste and send it to recycling centers.
### 3. 🏭 Recycling Center Dashboard
A QR scanner via html5-qrcode to scan QR generated on the user's dashboard, corresponding to a transaction ID.
Able to verify the e-waste item and credit user's wallet atomically.


### API Layer
The frontend communicates with three external APIs:
### 1. ✨ Gemini API
It is used for image recognition and chatbot. The model used is gemini-2.5-flash via @google/genai SDK. It is optimized for speed and cost while retaining strong multimodal capabilities. This means that it returns a near-instant response. When a user uploads a photo, gemini returns a structured output JSON matching the EWasteItem schema (name, category, estimated RM value, hazard flag), and user will be able to identify what the e-waste is, quickly. The structured output JSON will also connect to Firebase backend, and can be used when createTransaction cloud function was called. When a user asks Gemini questions about e-waste, it acts as an e-waste expert assistant. 
### 2. 🗺️ Google Maps JavaScript API
It is used for interactive map, determining user's position via browser-based Geolocation API, calculating distance between user and center via geoUtils.ts , get drivers a direct "Navigate" link to navigate to user's pickup location, and sort centers by proximity so the closest option will be shown to the user first. When user opens the "Pickup" page, this API is called to locate user's current location.
### 3. 📧 EmailJS
It is used to send pickup confirmation emails to users when a driver is assigned. User will not only get notify on our website, but also their e-mail.


### Backend/Database
The backend is serverless and all the server-side logic runs as Firebase Cloud Functions as it has zero infrastructure management, Admin SDK access, and atomic Firestore Transactions. Some Firebase products that we use are:
### 1. Cloud Functions:
Everytime when the frontend performs some sort of actions such as creating a transaction, it calls these cloud functions on the server side as these functions validate the caller's role, enforce business rules (e.g., only qr_generated transactions can be cancelled), and perform atomic Firestore operations. The frontend never writes directly to critical collections.
### 2. Firestore Database 
We store our core collections inside Firebase NoSQL database. It provides real-time sync as the frontend uses onSnapshot listeners on pickupRequests and transactions, so status changes appear instantly across all connected dashboards. For example, when a center scans QR, verifies and credits a user, the user's wallet updates instantly without refreshing.
### 3. Firebase Storage
It is used for e-waste image uploads in the "Chatbot" page. Images are stored under user-scoped paths `chat-uploads/{userUID}/{timestamp}-{filename}` with:
File validation: JPEG, PNG, WebP only, max 5 MB
Upload progress tracking via uploadBytesResumable
Secure download URLs returned after upload completes
### 4. Firebase Authentication 
It is used for email/password sign-up and login, session management, JWT tokens with custom role claims (user, driver, recycle_centers, admin).
### 5. Firestore Rules (Security Model)
Firestore rules enforce that the transactions collection has allow write: if false — meaning no client can create or modify transactions directly. All writes go through Cloud Functions, which validate the caller's role, check transaction status, and use Firestore transactions for atomicity. This prevents double-crediting, transaction spoofing, and unauthorized access.


### Workflow
This is the complete flow from a user side of perspective. This workflow also shows how driver and centers are linked to the user.

### 1. 📋 Sign Up/Login 
When a user signs up to a new account, Firebase Auth creates the account, cloud function `setDefaultRole` stamps a `user` role as a custom claim on the JWT token. New signup user now has a document under the `user` collection in Firestore. User lands on User Dashboard, which accesses our solution's features: Scan, Pickup, Wallet.
Note that our admin dashboard was not setted up for this demo. For now, promoting user’s role to driver or recycling_center will be conducted via running the utility script in `scripts/assignCenters.ts`
### 2. 🤖 "Scan & Identify" AI Chatbot
Users can now upload e-waste photos to the chatbot. The image is sent to Gemini 2.5 Flash with a structured schema prompt. Gemini then returns structured JSON output with item name, category, estimated RM value, hazard flag, and environmental impact note. Next, it will prompt users to choose "Send Manually", "Schedule Pickup" or "Just Asking". 
### 3. 🗺️ Choose Disposal Path
If the user chooses "Send Manually", the user will be redirected to the "Pickup" page, showing nearby recycling centers and can navigate to there with a link redirecting them to Google Maps. Cloud function `createTransaction` will create a transaction ID, which is then encoded into a QR generated on the Wallet page.
If the user chooses "Schedule Pickup", it will prompt the user to fill in address, contact number, and item details. The pooling algorithm checks if there's >= 5 items that exist within a 2km radius. If so, requests are grouped into a pool. 
On the driver’s dashboard, drivers see pooled tasks in their `/driver-dashboard` and can accept them. After the driver accepts, it navigates to the user's pickup location, collects the item, and sends it to the recycling center. Note that our demo code only demonstrates until the part where driver completes the pickup request, but there's no actual link of the driver and the recycling center, for now.
### 4. ✅ Verification
At the recycling center, center staff can access the `/center-dashboard`, scans the QR using html5-qrcode. The cloud function `verifyAndCredit` runs inside a Firestore transaction to atomically update the transaction status and credit the user's wallet.
### 5. Wallet
Users see their live wallet and full transaction history via real-time `onSnapshot` listeners.

---

## Installation & Setup

### 1. Environment Requirements
The project uses a modern, type-safe development stack:
Frontend: React 19+ with TypeScript, using Vite as the build tool.
Styling: Tailwind CSS (utility-first).
Backend: Firebase Cloud Functions v2 (serverless environment).
Database: Cloud Firestore (NoSQL).

### 2. Frontend InstallationClone and Install: 
Clone the repository and navigate to the root folder (where package.json is located). 
Run npm install to download all frontend dependencies, including React, TypeScript, and the Google Generative AI SDK.
Initialize Firebase: The firebase.ts file must be configured to initialize the Firebase SDK, including Authentication, Firestore, and Storage.
Local Execution: Start the development server using the Vite dev command (typically npm run dev).

### 3. Backend & Cloud Functions Setup
The backend lives in the functions/ directory and must be deployed to Google Cloud.
Install Backend Dependencies: Navigate to the functions/ folder and run npm install to install firebase-admin and firebase-functions.Deploy Functions: Use the Firebase CLI to push the five core server-side functions (setUserRole, setDefaultRole, createTransaction, cancelTransaction, and verifyAndCredit):
Security Rules: Deploy the firestore.rules file to define who can read and write to the database collections.

### 4. Environment Variables & API Key
For the system to function, sensitive keys must be stored as environment variables (typically in the hosting platform's settings, such as Vercel). The following keys are required:
VITE_GEMINI_API_KEY :Authenticates with Google Gemini AI for e-waste analysis.
VITE_FIREBASE_API_KEYI:dentifies the Firebase project.
VITE_FIREBASE_AUTH_DOMAIN:Firebase Authentication domain.
VITE_FIREBASE_PROJECT_ID:Unique Firebase project identifier.
VITE_EMAILJS_PUBLIC_KEY:Used for sending pickup confirmation emails.

---

## 🗺️ Future Roadmap

### 🟡 Short Term (0 – 6 Months)

#### 👤 User Experience
| Feature | Description |
|---|---|
| 🤖 Chatbot Upgrade | Integrate live Firestore data — turns chatbot into a full self-service support agent (e.g. notifies user if there's an active pool nearby in real time) |
| 🛡️ Fraud Detection | AI rule engine detects suspicious patterns such as extremely high submission volume from a single account |

#### 🚗 Driver Experience
| Feature | Description |
|---|---|
| 🎯 Smart Job Matching | AI automatically matches confirmed pools to the most suitable driver based on location, vehicle capacity, and current workload — replacing manual assignment |

#### 🏭 Recycling Center Experience
| Feature | Description |
|---|---|
| 📦 Pre-Arrival Notification | After pool confirmation, centers automatically receive an arrival summary — expected item types, estimated quantities, and approximate arrival time |

#### 🌍 Reaching a Larger Audience
- 📍 **Pilot Launch in Cheras** — Target high-density residential areas to refine pickup logistics and recommendation algorithm based on real user behavior before wider rollout
- 🤝 **ERTH Partnership** — Formalize collaboration, document and track key metrics (user satisfaction, average pooling count per week) from ERTH pickups

---

### 🟠 Medium Term (6 – 12 Months)

#### 👤 User Experience
| Feature | Description |
|---|---|
| 🪙 Rewards System | Each recycled item accumulates KitarCoins redeemable for vouchers |
| 🟢 Green Tier Badge | Users who recycle consistently earn a badge that grants priority pickup scheduling |

#### 🚗 Driver Experience
| Feature | Description |
|---|---|
| 🧑‍💼 Independent Driver Registration | Soft launch for individual drivers — ERTH handles corporate collections while independent drivers handle small high-demand pools |
| 💰 Platform Commission | Independent drivers earn per pool — KitarCash takes **20% platform commission** |

#### 🏭 Recycling Center Experience
| Feature | Description |
|---|---|
| 🏢 Corporate Contract Bidding | Recycling centers bid on long-term corporate e-waste collection contracts through the platform — KitarCash takes **10% commission** per confirmed collection |

#### 🌍 Reaching a Larger Audience
- 🎓 **Universities & NGOs** — Build e-waste awareness and onboard communities onto the platform
- 🏙️ **Regional Company Partners** — Target new logistics partners outside Klang Valley to expand geographic coverage

---

### 🔴 Long Term (12 Months+)

#### 👤 User Experience
| Feature | Description |
|---|---|
| 📊 ESG Sustainability Reports | AI auto-compiles corporate clients' recycling activity into formatted reports — total weight diverted from landfill, estimated CO₂ savings, item categories, pickup count |

#### 🚗 Driver Experience
| Feature | Description |
|---|---|
| 🗺️ Dynamic Route Optimization | AI suggests fuel-saving routes factoring in live traffic and road conditions as new nearby pickups are added |
| 🏆 ERTH as Premium Partner | Company fleets like ERTH handle corporate and bulk contracts only — all standard pickups handled entirely by independent drivers |

#### 🏭 Recycling Center Experience
| Feature | Description |
|---|---|
| 📈 Live Commodity Pricing Dashboard | Real-time spot prices for recoverable materials (copper, lithium, aluminum) |
| 🤖 AI Hold or Sell Recommendation | AI analyzes price trends and recommends whether to sell a material batch immediately or hold for a better price window |

#### 🌍 Reaching a Larger Audience
- 🌏 **Southeast Asia Expansion** — Sign master MOU agreements with large regional waste management groups operating across multiple SEA countries (e.g. Veolia) to expand without building local operations from scratch

---

### 📊 Roadmap Summary

| Phase | Timeline | Focus |
|---|---|---|
| 🟡 Short Term | 0 – 6 months | Chatbot upgrade, fraud detection, smart job matching, pre-arrival notifications, Cheras pilot, ERTH partnership |
| 🟠 Medium Term | 6 – 12 months | Rewards system, independent drivers, corporate bidding, university outreach, regional expansion |
| 🔴 Long Term | 12 months+ | ESG reports, route optimization, pricing intelligence, Southeast Asia MOU partnerships |

