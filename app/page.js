"use client";

import Link from 'next/link';

export default function Home() {
  const features = [
    {
      icon: '📊',
      title: 'Smart Analytics',
      description: 'Get detailed insights into your spending patterns with beautiful charts and reports.'
    },
    {
      icon: '💰',
      title: 'Expense Tracking',
      description: 'Effortlessly track and categorize your expenses with our intuitive interface.'
    },
    {
      icon: '🎯',
      title: 'Budget Goals',
      description: 'Set and monitor your budget goals to stay on track with your financial plans.'
    },
    {
      icon: '📱',
      title: 'Mobile Ready',
      description: 'Access your finances anywhere with our fully responsive design.'
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Master Your{' '}
              <span className="text-gradient">Finances</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Take control of your financial future with FinTrackr's premium expense tracking and budgeting tools. 
              Simple, elegant, and powerful.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/expenses/new"
                className="btn-primary text-lg px-8 py-3 animate-scale-in"
              >
                Start Tracking
              </Link>
              <Link 
                href="/dashboard"
                className="btn-secondary text-lg px-8 py-3 animate-scale-in"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage money
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our comprehensive suite of tools helps you understand, control, and optimize your spending habits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="card card-hover animate-fade-in text-center group"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to take control of your finances?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who have already transformed their financial habits with FinTrackr.
          </p>
          <Link 
            href="/expenses/new"
            className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  );
}
