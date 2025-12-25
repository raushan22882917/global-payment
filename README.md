# Global Payment Management System

A comprehensive enterprise-grade payment management system built with Next.js, Firebase, and modern web technologies. This system handles payment requests, multi-level approvals, and payment releases with support for Indian payment methods including UPI, QR codes, and bank transfers.

## 🌟 Features

### 🔐 Authentication & Authorization
- **Multi-provider Authentication**: Google OAuth, Email/Password
- **Role-based Access Control**: Super Admin, Organization Admin, Organization Users
- **Password Reset**: Secure password reset with email verification
- **Remember Me**: Persistent login sessions

### 💳 Payment Management
- **Payment Requests**: Create detailed payment requests with attachments
- **Multi-level Approvals**: Configurable approval workflows
- **Payment Methods**: UPI, Bank Transfer, QR Code generation
- **Payment Release**: Integrated payment processing with popular gateways
- **Real-time Status**: Live updates on payment status

### 🏢 Organization Management
- **Multi-tenant Architecture**: Support for multiple organizations
- **User Management**: Invite and manage organization members
- **Settings & Configuration**: Customizable payment settings
- **Logo Upload**: Organization branding with logo support

### 🔄 Workflow Engine
- **Visual Workflow Builder**: Drag-and-drop approval workflow designer
- **Conditional Routing**: Smart routing based on amount, department, urgency
- **Audit Trails**: Complete history of all actions and approvals

### 🤖 AI-Powered Features
- **Email Templates**: AI-generated email templates using Google Gemini
- **Smart Suggestions**: Intelligent recommendations for approvals
- **Content Generation**: Automated content creation

### 📊 Analytics & Reporting
- **Dashboard**: Comprehensive analytics and insights
- **Financial Reports**: Detailed financial reporting and tracking
- **Performance Metrics**: System performance and usage analytics

## 🚀 Tech Stack

**Frontend:**
- Next.js 14 with App Router
- React 18 with TypeScript
- Tailwind CSS for styling
- React Hook Form for form management

**Backend & Database:**
- Firebase Authentication
- Cloud Firestore (NoSQL)
- Firebase Storage
- Firebase Functions

**AI & Integrations:**
- Google Gemini AI
- Razorpay, Paytm, PhonePe APIs
- UPI Payment Integration
- SMTP Email Services

**Development Tools:**
- TypeScript for type safety
- ESLint & Prettier for code quality
- Git for version control

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account
- Google Cloud Platform account

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/raushan22882917/global-payment.git
   cd global-payment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Firebase Setup**
   - Create a Firebase project
   - Enable Authentication (Google, Email/Password)
   - Set up Firestore database
   - Configure Firebase Storage
   - Download service account key

5. **Deploy Firestore Rules**
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only storage
   ```

6. **Run Development Server**
   ```bash
   npm run dev
   ```

7. **Create Super Admin User**
   ```bash
   node scripts/create-super-admin.js
   ```

## 🔧 Configuration

### Firebase Setup
1. **Authentication Providers**
   - Enable Google OAuth in Firebase Console
   - Configure authorized domains
   - Set up OAuth consent screen

2. **Firestore Database**
   - Create database in production mode
   - Deploy security rules from `firestore.rules`
   - Set up composite indexes

3. **Storage Configuration**
   - Enable Firebase Storage
   - Deploy storage rules from `storage.rules`
   - Configure CORS if needed

### Payment Gateway Setup
1. **Razorpay Integration**
   - Create Razorpay account
   - Get API keys
   - Configure webhook endpoints

2. **UPI Configuration**
   - Set up UPI merchant account
   - Configure QR code generation
   - Test payment flows

## 📚 Usage

### For Super Admins
1. **Organization Management**
   - Create and manage organizations
   - Approve organization requests
   - Monitor system-wide analytics

2. **User Management**
   - Create and manage users
   - Assign roles and permissions
   - Monitor user activities

### For Organization Admins
1. **Team Management**
   - Invite team members
   - Configure approval workflows
   - Set payment policies

2. **Payment Configuration**
   - Enable payment methods
   - Set approval thresholds
   - Configure payment gateways

### For Organization Users
1. **Payment Requests**
   - Create payment requests
   - Track approval status
   - View payment history

2. **Dashboard**
   - View pending requests
   - Monitor team activities
   - Access reports

## 🛠️ Development

### Project Structure
```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── org/               # Organization pages
│   ├── super-admin/       # Super admin pages
│   └── globals.css        # Global styles
├── components/            # Reusable components
├── contexts/              # React contexts
├── lib/                   # Utility functions
├── scripts/               # Utility scripts
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

### Key Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Utility Scripts
```bash
node scripts/create-super-admin.js           # Create super admin user
node scripts/debug-authentication.js        # Debug auth issues
node scripts/fix-user-uid-mismatches.js     # Fix UID mismatches
node scripts/test-firebase-config.js        # Test Firebase config
```

## 🔒 Security

### Authentication Security
- Multi-factor authentication support
- Secure password policies
- Session management
- Role-based access control

### Data Security
- Firestore security rules
- Input validation and sanitization
- Encrypted data transmission
- Audit logging

### Payment Security
- PCI DSS compliance considerations
- Secure payment processing
- Encrypted sensitive data
- Fraud detection measures

## 📈 Performance

### Optimization Features
- Server-side rendering (SSR)
- Static site generation (SSG)
- Code splitting and lazy loading
- Image optimization
- Caching strategies

### Monitoring
- Performance monitoring with Firebase
- Error tracking and logging
- Analytics and user behavior tracking
- System health monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Maintain code documentation
- Follow the existing code style
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Firebase team for the excellent backend services
- Next.js team for the amazing React framework
- Tailwind CSS for the utility-first CSS framework
- Google Gemini AI for AI-powered features
- Indian payment gateway providers for integration support

## 📞 Support

For support and questions:
- Create an issue in this repository
- Check the documentation in the `/docs` folder
- Review troubleshooting guides in the project

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Firebase Hosting
1. Install Firebase CLI
2. Configure `firebase.json`
3. Deploy with `firebase deploy`

### Manual Deployment
1. Build the project: `npm run build`
2. Start the server: `npm start`
3. Configure reverse proxy (nginx/Apache)

---

**Built with ❤️ for modern payment management**