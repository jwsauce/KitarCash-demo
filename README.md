<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1kXxkmwuRq9vG6Hiy8E7mGSiNEMD0TcbV

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Project Overview: KitarCash

### 1. Problem Statement

Malaysia is currently facing a critical "E-waste Paradox" where high public awareness fails to translate into effective action. This challenge primarily affects Malaysian households, who struggle with a lack of convenient disposal infrastructure, and 157+ licensed recovery facilities that are now facing a severe raw material shortage. Following the Absolute Prohibition on e-waste imports enacted on February 4, 2026, these industrial plants can no longer rely on foreign feedstock, making domestic e-waste recovery a matter of national industrial survival. Current solutions fail because they rely on passive "drop-off" models that place the logistical burden on the consumer without offering tangible incentives. As Malaysia is estimated to generate 24.5 million units of e-waste in 2025, we must bridge the gap between household "waste generators" and industrial "recoverers" to prevent both environmental degradation and the collapse of our local recycling infrastructure.



### 2. SDG Alignment

Our solution is strategically mapped to three United Nations Sustainable Development Goals:



SDG 12 (Responsible Consumption & Production) - Target 12.5 & 12.4: We aim to substantially increase recycling rates by breaking the "Inconvenience Barrier" and ensuring hazardous materials are managed through professional, environmentally sound lifecycles.

SDG 9 (Industry, Innovation, & Infrastructure) - Target 9.4: We provide the digital infrastructure needed to modernize Malaysia’s recycling industry, securing a domestic supply chain for factories cut off from foreign imports.

SDG 11 (Sustainable Cities & Communities) - Target 11.6: We reduce the environmental impact of Malaysian cities by optimizing municipal waste management through an automated collection model.

### 3. Short Description of the Solution

KitarCash is an AI-driven logistics and incentive platform that functions as a "digital middleman" to bridge the gap in Malaysia's e-waste supply chain. Our system automates the connection between households and licensed recovery centers by providing a seamless doorstep pickup service and instant Cashback rewards. By using a smart pooling system, we transform scattered household waste into profitable industrial feedstock. Additionally, we utilize Gemini AI to guide users through secure data-wiping, ensuring that personal privacy is protected while diverting toxic chemicals from landfills into professional recycling channels.

### 4. Key Features

⚠️ Hazard Awareness System
Hazardous items flagged by Gemini AI trigger in-app warnings and a data safety guide, educating users on safe handling before disposal.

🤖 AI-Powered E-Waste Identification
Upload a photo of any e-waste item and Google Gemini 2.5 Flash instantly identifies it, estimates its recycling value in Ringgit Malaysia, flags any hazards, and provides environmental impact notes. The chatbot also supports conversational Q&A for recycling-related queries.

🗺️ Interactive Center Map
Google Maps displays nearby recycling centers relative to the user's live location, with distances calculated client-side using the Haversine formula.

🚚 Community Pickup Pooling
Users can schedule a pickup instead of visiting a center. The pooling algorithm groups nearby requests within a two-kilometre radius and dispatches a single driver once the minimum quantity threshold is met, making collection free through economies of scale.

💰 Real-Time Digital Wallet
Wallet credits are issued the instant center staff verify an item. An atomic Cloud Function ensures payment and verification occur together or not at all, preventing any possibility of fraud or double-crediting.

📱 QR Code Transaction System
Every recycling transaction generates a unique QR code, creating a verifiable link between the user's submission and the recycling center's physical verification — eliminating manual paperwork entirely.

🔒 Role-Based Access Control
Four user roles — recycler, recycling center staff, driver, and admin — each with dedicated dashboards. Roles are embedded in Firebase JWT tokens server-side, preventing any possibility of self-assigned elevated permissions.

