import React from 'react';
import { Navbar } from '@/components/navbar/Navbar';
import ForumContainer from '@/components/forum/ForumContainer';
import { Helmet } from 'react-helmet-async';

const CommunityForumPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50">
      <Helmet>
        <title>Community Forum | Eco-Friendly Navigator</title>
        <meta name="description" content="Join our community forum to discuss waste management, recycling tips, and environmental conservation." />
      </Helmet>
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">Community Forum</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Connect with like-minded individuals, share your experiences, ask questions, and learn from others about waste management and environmental conservation.
            </p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-green-700 mb-4">Forum Guidelines</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Be respectful and considerate of other community members.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Share your knowledge and experiences to help others.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Ask questions if you're unsure about waste management practices.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Report inappropriate content to help maintain a positive environment.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Stay on topic and avoid spam or promotional content.</span>
              </li>
            </ul>
          </div>
          
          <ForumContainer />
        </div>
      </main>
    </div>
  );
};

export default CommunityForumPage;
