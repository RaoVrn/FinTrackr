"use client";

import { useState, useEffect } from 'react';

export default function ProfileCompletionTracker({ user, completionPercentage = 0, isLoading = false }) {
  const [expandedSection, setExpandedSection] = useState(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="h-3 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate section completion status
  const getSectionStatus = () => {
    if (!user) return { basicInfo: false, contactDetails: false, financialInfo: false };

    const basicInfo = !!(user.name && user.email);
    const contactDetails = !!(user.phone || (user.address && (user.address.street || user.address.city)));
    const financialInfo = !!(user.monthlyIncome && user.monthlyIncome > 0 && user.occupation);

    return { basicInfo, contactDetails, financialInfo };
  };

  const sectionStatus = getSectionStatus();

  const sections = [
    {
      id: 'basicInfo',
      title: 'Basic Information',
      icon: '👤',
      completed: sectionStatus.basicInfo,
      items: [
        { label: 'Full Name', value: user?.name, required: true },
        { label: 'Email Address', value: user?.email, required: true },
        { label: 'Date of Birth', value: user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : null, required: false },
        { label: 'Profile Picture', value: user?.profileImage, required: false }
      ]
    },
    {
      id: 'contactDetails',
      title: 'Contact Details',
      icon: '📱',
      completed: sectionStatus.contactDetails,
      items: [
        { label: 'Phone Number', value: user?.phone, required: true },
        { label: 'Street Address', value: user?.address?.street, required: false },
        { label: 'City', value: user?.address?.city, required: true },
        { label: 'State', value: user?.address?.state, required: false },
        { label: 'Zip Code', value: user?.address?.zipCode, required: false }
      ]
    },
    {
      id: 'financialInfo',
      title: 'Financial Information',
      icon: '💰',
      completed: sectionStatus.financialInfo,
      items: [
        { label: 'Monthly Income', value: user?.monthlyIncome ? `₹${user.monthlyIncome.toLocaleString()}` : null, required: true },
        { label: 'Occupation', value: user?.occupation, required: true },
        { label: 'Currency Preference', value: user?.currency, required: false }
      ]
    }
  ];

  const completedSections = sections.filter(section => section.completed).length;
  const totalSections = sections.length;

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const getStatusIcon = (completed) => {
    return completed ? (
      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    ) : (
      <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
        <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
        <h3 className="text-lg md:text-xl font-semibold text-gray-900">Profile Completion</h3>
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-500">
            {completedSections} of {totalSections} sections complete
          </span>
          <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            {Math.round(completionPercentage)}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-600">{Math.round(completionPercentage)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              completionPercentage >= 80
                ? 'bg-green-500'
                : completionPercentage >= 50
                ? 'bg-blue-500'
                : 'bg-yellow-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Getting Started</span>
          <span className="hidden sm:inline">In Progress</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {sections.map((section) => (
          <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(section.completed)}
                <span className="text-xl">{section.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm md:text-base">{section.title}</h4>
                  <p className="text-xs md:text-sm text-gray-500">
                    {section.completed ? (
                      <span className="text-green-600">✓ Complete</span>
                    ) : (
                      <span className="text-amber-600">⚠ Needs attention</span>
                    )}
                  </p>
                </div>
              </div>
              <svg
                className={`w-4 h-4 md:w-5 md:h-5 text-gray-400 transform transition-transform duration-200 ${
                  expandedSection === section.id ? 'rotate-180' : ''
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Expanded Section Details */}
            {expandedSection === section.id && (
              <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                <div className="space-y-1 mt-3">
                  {section.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white transition-colors">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm text-gray-600">{item.label}</span>
                        {item.required && (
                          <span className="text-xs text-red-500">*</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.value ? (
                          <span className="text-xs md:text-sm text-gray-900 max-w-32 md:max-w-xs truncate font-medium">
                            {item.value}
                          </span>
                        ) : (
                          <span className="text-xs md:text-sm text-gray-400">Not provided</span>
                        )}
                        {item.value ? (
                          <div className="w-3 h-3 md:w-4 md:h-4 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-2 h-2 md:w-2.5 md:h-2.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-3 h-3 md:w-4 md:h-4 bg-gray-200 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Completion Message */}
      <div className="mt-6 text-center">
        {completionPercentage >= 100 ? (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-green-800 font-medium">🎉 Congratulations! Your profile is complete!</p>
            <p className="text-sm text-green-600 mt-1">
              You're all set to make the most of FinTrackr's features.
            </p>
          </div>
        ) : completionPercentage >= 75 ? (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 font-medium">Almost there! Just a few more details needed.</p>
            <p className="text-sm text-blue-600 mt-1">
              Complete your profile to unlock all features.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800 font-medium">Let's complete your profile!</p>
            <p className="text-sm text-yellow-600 mt-1">
              Add more information to get personalized insights and recommendations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}