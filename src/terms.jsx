import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl pb-20">
        <Link to="/signup" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={18} />Back to Sign Up
        </Link>
        
        <h1 className="text-3xl font-bold mb-6">PrimeVest Terms and Conditions of Service</h1>
        <div className="space-y-6 text-sm leading-relaxed text-slate-300">
          <p><strong>Last Updated: October 2026</strong></p>
          <p>Welcome to PrimeVest. These Terms and Conditions ("Terms", "Agreement") constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you", "User", "Investor") and PrimeVest ("we", "us", or "our"), concerning your access to and use of the PrimeVest website as well as any other media form, media channel, mobile website, or mobile application related, linked, or otherwise connected thereto (collectively, the "Site").</p>
          <p>By accessing the Site, creating an account, or utilizing any of our financial, gamified, or investment products, you agree that you have read, understood, and agreed to be bound by all of these Terms and Conditions. If you do not agree with all of these Terms and Conditions, then you are expressly prohibited from using the Site and you must discontinue use immediately.</p>

          <h2 className="text-xl font-bold text-white mt-8">1. ELIGIBILITY AND ACCOUNT REGISTRATION</h2>
          <p>1.1. To use PrimeVest, you must be at least 18 years of age and have the legal capacity to enter into binding contracts. By creating an account, you represent and warrant that you meet these requirements.</p>
          <p>1.2. You agree to provide accurate, current, and complete information during the registration process. You are solely responsible for maintaining the confidentiality of your account credentials and password.</p>
          <p>1.3. You agree to notify us immediately of any unauthorized use of your account. PrimeVest will not be liable for any loss or damage arising from your failure to comply with this security obligation.</p>
          <p>1.4. We reserve the right to suspend or terminate your account if any information provided during the registration process proves to be inaccurate, false, or misleading.</p>

          <h2 className="text-xl font-bold text-white mt-8">2. NATURE OF THE PLATFORM AND FINANCIAL SERVICES</h2>
          <p>2.1. PrimeVest is a digital wealth management and gamified investment platform. We provide users with various investment portfolio options, a tap-to-earn bonus game, and referral-based earning structures.</p>
          <p>2.2. <strong>No Financial Advice:</strong> The information provided on the Site is not intended to be a substitute for professional financial advice. You should consult with a qualified financial advisor before making any investment decisions.</p>
          <p>2.3. <strong>Risk Acknowledgment:</strong> All investments involve a degree of risk. You acknowledge that you are investing at your own risk.</p>

          <h2 className="text-xl font-bold text-white mt-8">3. DEPOSITS AND WITHDRAWALS</h2>
          <p>3.1. <strong>Deposits:</strong> Users can deposit funds into their PrimeVest wallet using Paystack (for card and bank transfers) and cryptocurrency (Bitcoin via NOWPayments). The minimum deposit amount is set at ₦7,500.00.</p>
          <p>3.2. <strong>Card Payments:</strong> Card deposits are processed securely through Paystack. PrimeVest does not store or have access to your raw credit/debit card information.</p>
          <p>3.3. <strong>Withdrawals:</strong> The minimum withdrawal amount is ₦3,000.00. Withdrawals are processed to the bank account details provided by the user. PrimeVest utilizes Paystack's account resolution feature to verify bank accounts and prevent fraud.</p>
          <p>3.4. <strong>Processing Time:</strong> Withdrawals are subject to review and may take up to 24 hours to process. PrimeVest reserves the right to delay or deny any withdrawal request if there is suspected fraudulent activity.</p>

          <h2 className="text-xl font-bold text-white mt-8">4. INVESTMENT PLANS AND FORMATS</h2>
          <p>PrimeVest offers distinct investment plans, each with its own rules, parameters, and expected returns.</p>
          <p><strong>4.1. Growth Portfolio</strong><br/>(a) Designed for steady, daily returns.<br/>(b) Minimum investment is ₦2,000.<br/>(c) Users are entitled to claim a daily profit of up to ₦300.00.<br/>(d) <strong>Capital Lock:</strong> The initial investment amount is locked for 7 days.</p>
          <p><strong>4.2. Affiliate Marketing</strong><br/>(a) Social-driven investment. Minimum investment is ₦11,500.<br/>(b) Users share their unique referral link via social media platforms.<br/>(c) <strong>Simulated Earning Engine:</strong> Users will receive device notifications indicating that an anonymous user has interacted with their referral network.<br/>(d) These simulated activities generate random bonus rewards ranging from ₦3,000 to ₦20,000.</p>
          <p><strong>4.3. Real Estate</strong><br/>(a) Invest in digital representations of property portfolios. Minimum investment is ₦15,000.<br/>(b) Users will be presented with various property tiers.<br/>(c) The larger the estate tier selected, the higher the return percentage.</p>
          <p><strong>4.4. Crypto Index</strong><br/>(a) Exposure to digital assets. Minimum investment is ₦19,000.<br/>(b) <strong>Flexible Tenure:</strong> Users can choose their investment lock period: 30 Days, 3 Months, 6 Months, or 1 Year.</p>

          <h2 className="text-xl font-bold text-white mt-8">5. BONUS GAME AND DAILY REWARDS</h2>
          <p>5.1. <strong>Tap-to-Earn:</strong> Users can tap the screen to generate points. Points are converted to Naira at a set ratio (5 points = ₦1).</p>
          <p>5.2. Attempting to abuse, automate, or script the game will result in account termination.</p>
          <p>5.3. <strong>Daily Login Streak:</strong> Users who log in and claim their daily reward are eligible for a ₦100 bonus every 24 hours.</p>
          <p>5.4. <strong>Referral Bonuses:</strong> PrimeVest offers a ₦1,000 reward for the first eligible referral share, and ₦200 for subsequent shares.</p>

          <h2 className="text-xl font-bold text-white mt-8">6. ENFORCEMENT OF NO RETURN AND RISK DISCLOSURE</h2>
          <p>6.1. <strong>Strict No-Refund Policy:</strong> All deposits made to your PrimeVest wallet are final. We do not offer refunds for funds that have been used to purchase investment plans.</p>
          <p>6.2. <strong>No Guarantees:</strong> The platform and its developers are not liable for any market downturns, crypto crashes, or system failures that result in the loss of capital.</p>
          <p>6.3. <strong>Account Enforcement:</strong> If a user violates these Terms, engages in fraudulent activities, attempts to hack the platform, or abuses the bonus systems, PrimeVest reserves the right to freeze the account and forfeit the user's balance.</p>

          <h2 className="text-xl font-bold text-white mt-8">7. CUSTOMER CARE AND DISPUTE RESOLUTION</h2>
          <p>7.1. If you encounter any issues, please contact our support team at <strong>demo@gmail.com</strong>.</p>
          <p>7.2. Any disputes arising from the use of the platform shall be resolved through mutual negotiation.</p>

          <h2 className="text-xl font-bold text-white mt-8">8. LIMITATION OF LIABILITY</h2>
          <p>11.1. IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SITE.</p>

          <h2 className="text-xl font-bold text-white mt-8">9. ACKNOWLEDGMENT</h2>
          <p>BY USING PRIMEVEST, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS AND CONDITIONS OF SERVICE, UNDERSTAND THEM, AND AGREE TO BE BOUND BY THEM.</p>
        </div>
      </div>
    </main>
  );
}