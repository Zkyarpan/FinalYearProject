'use client';

import React from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Video,
  MessageSquare,
  Users,
  Clock,
  AlertCircle,
} from 'lucide-react';

// This would come from your API/backend
const mockProfile = {
  firstName: 'John',
  lastName: 'Doe',
  image:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  address: '123 Therapy Street, Medical District',
  phone: '+1 (555) 123-4567',
  age: 32,
  gender: 'male',
  emergencyContact: 'Jane Doe',
  emergencyPhone: '+1 (555) 987-6543',
  therapyHistory: 'yes',
  preferredCommunication: 'video',
  struggles: ['Anxiety', 'Depression', 'Work Stress'],
  briefBio:
    'Dedicated professional seeking to improve mental well-being and develop better coping mechanisms for daily challenges.',
  profileCompleted: true,
};

const AccountPage = () => {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <img
                src={mockProfile.image}
                alt={`${mockProfile.firstName} ${mockProfile.lastName}`}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              {mockProfile.profileCompleted && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border-2 border-white">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {mockProfile.firstName} {mockProfile.lastName}
              </h1>
              <p className="text-gray-500 mt-1">
                Age: {mockProfile.age} •{' '}
                {mockProfile.gender.charAt(0).toUpperCase() +
                  mockProfile.gender.slice(1)}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
                {mockProfile.struggles.map(struggle => (
                  <span
                    key={struggle}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
                  >
                    {struggle}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span>{mockProfile.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span>{mockProfile.address}</span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Emergency Contact</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <span>{mockProfile.emergencyContact}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span>{mockProfile.emergencyPhone}</span>
              </div>
            </div>
          </div>

          {/* Therapy Preferences */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Therapy Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-gray-400" />
                <span>
                  Preferred:{' '}
                  {mockProfile.preferredCommunication.charAt(0).toUpperCase() +
                    mockProfile.preferredCommunication.slice(1)}{' '}
                  Sessions
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span>
                  Previous Therapy:{' '}
                  {mockProfile.therapyHistory === 'yes' ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">About Me</h2>
            <p className="text-gray-600">{mockProfile.briefBio}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
