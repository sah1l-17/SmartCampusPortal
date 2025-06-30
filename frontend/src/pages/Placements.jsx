"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { TrendingUp, Building, DollarSign, Users, Upload } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import axios from "axios"
import toast from "react-hot-toast"
import LoadingSpinner from "../components/LoadingSpinner"
import { PlacementUploadModal } from "./Dashboard";

const Placements = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [placements, setPlacements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPlacementUpload, setShowPlacementUpload] = useState(false)

  useEffect(() => {
    fetchPlacementData()
  }, [])

  const fetchPlacementData = async () => {
    try {
      const [statsResponse, placementsResponse] = await Promise.all([
        axios.get("/placements/stats"),
        axios.get("/placements"),
      ])

      setStats(statsResponse.data)
      setPlacements(placementsResponse.data.placements)
    } catch (error) {
      console.error("Fetch placement data error:", error)
      toast.error("Failed to fetch placement data")
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSuccess = () => {
    setShowPlacementUpload(false)
    fetchPlacementData() // Refresh the data after successful upload
  }

  if (loading) {
    return <LoadingSpinner text="Loading placement data..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placements</h1>
          <p className="text-gray-600">Track and analyze placement records</p>
        </div>
        {user?.role === "admin" && (
          <button
            onClick={() => setShowPlacementUpload(true)}
            className="btn btn-primary flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Placements
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Placements</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.yearlyStats?.reduce((acc, year) => acc + year.totalPlacements, 0) || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Package (LPA)</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.yearlyStats?.[0]?.averagePackage?.toFixed(1) || "0"}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Highest Package (LPA)</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.yearlyStats?.[0]?.highestPackage || "0"}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Building className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Companies</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.yearlyStats?.[0]?.companies?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Placement Upload Modal */}
      {showPlacementUpload && (
        <PlacementUploadModal 
          onClose={() => setShowPlacementUpload(false)} 
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Rest of your existing placement page content... */}
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Yearly Placement Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.yearlyStats || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalPlacements" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Department-wise Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats?.departmentStats || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="totalPlacements"
              >
                {stats?.departmentStats?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Placement Records Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Placements</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package (LPA)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {placements.map((placement) => (
                <tr key={placement._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{placement.studentName}</div>
                      <div className="text-sm text-gray-500">{placement.studentId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{placement.companyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{placement.package}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{placement.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{placement.yearOfPlacement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {placements.length === 0 && (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No placement records found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Placements