'use client'
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function AddUserPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "assistant",
    isActive: true,
    password: generatePassword(), // Generate a random password
    image: "",
    researcherId: ""
  })

  const [showDialog, setShowDialog] = useState(false)

  // Function to generate a random password
  function generatePassword() {
    const length = 12
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return false
    }
    if (!form.email.trim()) {
      toast.error("Email is required")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Invalid email format")
      return false
    }
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setShowDialog(true)
    }
  }

  const sendWelcomeEmail = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: "nh_rafa@esi.dz",
          subject: 'Your Account Has Been Created',
          text: `Dear ${name},\n\nYour account has been created on our platform.\n\nYour login credentials:\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after logging in.\n\nBest regards,\nThe Admin Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a365d;">Your Account Has Been Created</h2>
              <p>Dear ${name},</p>
              <p>Your account has been created on our platform. Here are your login credentials:</p>
              <div style="background: #f7fafc; padding: 16px; border-radius: 4px; margin: 16px 0;">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${password}</p>
              </div>
              <p style="color: #e53e3e;">Please change your password after logging in.</p>
              <p>Best regards,<br>The Admin Team</p>
            </div>
          `,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send welcome email')
      }
    } catch (error) {
      console.error('Error sending welcome email:', error)
      throw error
    }
  }

  const confirmSubmit = async () => {
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        isActive: form.isActive,
        image: form.image,
        researcherId: form.researcherId || null
      };

      // Create user
      const createResponse = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.expires}`
        },
        body: JSON.stringify(payload)
      });

      const createResult = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createResult.error || 'Failed to create user');
      }

      // Send welcome email
      await sendWelcomeEmail(
        form.email,
        form.password,
        form.name
      );

      toast.success('User created successfully');
      router.push('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(message);
      console.error('Add user failed:', error);
    } finally {
      setShowDialog(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="rounded-lg border border-[#e2e8f0] shadow-sm">
        <CardHeader className="border-b border-[#e2e8f0] bg-[#f8fafc]">
          <CardTitle className="text-xl font-semibold text-[#1e293b]">Add New User</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Full Name *</label>
                  <Input 
                    name="name" 
                    value={form.name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Email *</label>
                  <Input 
                    name="email" 
                    type="email" 
                    value={form.email} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Profile Image URL</label>
                  <Input 
                    name="image" 
                    value={form.image} 
                    onChange={handleChange} 
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Role *</label>
                  <Select 
                    value={form.role}
                    onValueChange={(value) => handleSelectChange("role", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="director">Director</SelectItem>
                      <SelectItem value="assistant">Assistant</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Status</label>
                  <Select 
                    value={form.isActive ? "active" : "inactive"}
                    onValueChange={(value) => handleSelectChange("isActive", value === "active")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Researcher ID (optional)</label>
                  <Input 
                    name="researcherId" 
                    value={form.researcherId} 
                    onChange={handleChange} 
                    placeholder="Leave empty if not a researcher"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full">
                Add User
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm User Creation</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p>Are you sure you want to create this user?</p>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="font-medium">{form.name}</p>
              <p className="text-sm text-gray-600">{form.email}</p>
              <p className="text-sm mt-2">
                Role: <span className="font-medium capitalize">{form.role}</span>
              </p>
              <p className="text-sm">
                Status: <span className="font-medium">{form.isActive ? "Active" : "Inactive"}</span>
              </p>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              An email with login credentials will be sent to {form.email}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSubmit}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}