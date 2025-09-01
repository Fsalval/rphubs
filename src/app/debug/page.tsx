'use client';

export default function DebugPage() {
  const envVars = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓ SET' : '✗ MISSING',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '✗ MISSING',
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '✗ MISSING',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '✗ MISSING',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '✗ MISSING',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '✗ MISSING',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✓ SET' : '✗ MISSING',
    cloudinaryName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '✗ MISSING',
    cloudinaryApiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '✗ MISSING',
    cloudinaryPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '✗ MISSING'
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Firebase & Cloudinary Config</h1>
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold text-lg mb-2">Environment Variables Status:</h2>
        <pre className="text-sm">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>
      
      <div className="bg-blue-100 p-4 rounded">
        <h2 className="font-bold text-lg mb-2">Instructions for Production:</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Ensure all environment variables are set in Vercel dashboard</li>
          <li>Add your Vercel domain to Firebase authorized domains</li>
          <li>Redeploy after making changes</li>
        </ol>
      </div>
    </div>
  );
}
