"use client"

import { ArrowLeft, Users, Target, Award, Heart } from "lucide-react"
import { useNavigate } from "react-router-dom"

const About = () => {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1) // Go back to previous page
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-6 mb-8">
        <div className="flex-shrink-0 mb-4 md:mb-0">
          <img src="/vite.svg" alt="Smart Campus Portal" className="h-16 w-16 rounded-full shadow-lg" />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">About Smart Campus Portal</h1>
          <p className="text-gray-500 mt-2 text-lg">Empowering education through technology</p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="bg-white rounded-xl shadow p-8">
        <div className="text-center mb-8">
          <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            To revolutionize campus management by providing a comprehensive, user-friendly platform that connects
            students, faculty, and administrators, fostering better communication, streamlined processes, and enhanced
            educational experiences.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <Users className="h-10 w-10 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Student Management</h3>
          <p className="text-gray-600 text-sm">
            Comprehensive student profiles, enrollment tracking, and academic progress monitoring.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <Award className="h-10 w-10 text-purple-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Course Management</h3>
          <p className="text-gray-600 text-sm">
            Easy course creation, enrollment management, and assignment tracking for faculty.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <Heart className="h-10 w-10 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Event Coordination</h3>
          <p className="text-gray-600 text-sm">
            Seamless event planning, registration, and management for campus activities.
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-xl shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Platform Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">1000+</div>
            <div className="text-gray-600">Active Students</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">50+</div>
            <div className="text-gray-600">Faculty Members</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">200+</div>
            <div className="text-gray-600">Courses Offered</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">500+</div>
            <div className="text-gray-600">Events Organized</div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-white rounded-xl shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Innovation</h3>
            <p className="text-gray-600 text-sm">
              Continuously improving our platform with cutting-edge technology and user-centered design.
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Accessibility</h3>
            <p className="text-gray-600 text-sm">
              Ensuring our platform is accessible to all users, regardless of their technical expertise.
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Community</h3>
            <p className="text-gray-600 text-sm">
              Building stronger connections within the campus community through better communication tools.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Get in Touch</h2>
        <div className="text-center space-y-2">
          <p className="text-gray-600">
            <strong>Email:</strong> mangesh.shah29@gmail.com
          </p>
          <p className="text-gray-600">
            <strong>Phone:</strong> +91 9619519031
          </p>
        </div>
      </div>
    </div>
  )
}

export default About
