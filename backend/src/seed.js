import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Visitor } from './models/Visitor.js';
import { Appointment } from './models/Appointment.js';
import { Pass } from './models/Pass.js';
import { CheckLog } from './models/CheckLog.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/visitor-pass-db';

const departments = ['Human Resources', 'Engineering', 'Finance', 'Operations', 'Sales', 'Legal'];
const purposes = ['Job Interview', 'Client Meeting', 'Maintenance', 'Business Review', 'Delivery', 'Consultation'];

const seedDB = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Database connected. Clearing existing collections...');

    // Clear existing data
    await User.deleteMany({});
    await Visitor.deleteMany({});
    await Appointment.deleteMany({});
    await Pass.deleteMany({});
    await CheckLog.deleteMany({});
    console.log('Existing collections cleared.');

    // 1. Create Admin User
    console.log('Seeding Users (Admin, Employees, Security)...');
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@visitorpass.com',
      password: 'password123',
      role: 'ADMIN',
      phone: '+15550100',
      isVerified: true
    });

    // 2. Create 5 Employees
    const employees = [];
    for (let i = 1; i <= 5; i++) {
      const emp = await User.create({
        name: `Employee Host ${i}`,
        email: `employee${i}@visitorpass.com`,
        password: 'password123',
        role: 'EMPLOYEE',
        phone: `+1555020${i}`,
        department: departments[i % departments.length],
        isVerified: true
      });
      employees.push(emp);
    }

    // 3. Create 3 Security Staff
    const securityStaff = [];
    for (let i = 1; i <= 3; i++) {
      const sec = await User.create({
        name: `Frontdesk Security ${i}`,
        email: `security${i}@visitorpass.com`,
        password: 'password123',
        role: 'SECURITY',
        phone: `+1555030${i}`,
        department: 'Security Operations',
        isVerified: true
      });
      securityStaff.push(sec);
    }

    // 4. Create 20 Visitors
    console.log('Seeding 20 Visitors...');
    const visitors = [];
    const visitorNames = [
      'John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Miller', 'Charlie Davis',
      'Diana Prince', 'Evan Wright', 'Fiona Gallagher', 'George Clooney', 'Hannah Montana',
      'Ian Malcolm', 'Julia Roberts', 'Kevin Bacon', 'Laura Croft', 'Michael Scott',
      'Nancy Wheeler', 'Oliver Twist', 'Penelope Cruz', 'Quentin Tarantino', 'Rachel Green'
    ];

    for (let i = 0; i < 20; i++) {
      // Also register half of them as Users to demonstrate registered visitor dashboards
      let userId;
      if (i < 10) {
        const visitorUser = await User.create({
          name: visitorNames[i],
          email: `visitor${i + 1}@visitorpass.com`,
          password: 'password123',
          role: 'VISITOR',
          phone: `+1555040${i + 1}`,
          isVerified: true
        });
        userId = visitorUser._id;
      }

      // Distribute hosts
      const host = employees[i % employees.length];

      const visitor = await Visitor.create({
        fullName: visitorNames[i],
        email: `visitor${i + 1}@visitorpass.com`,
        phone: `+1555040${i + 1}`,
        photo: '', // default placeholder will be rendered
        company: i % 3 === 0 ? 'Google' : i % 3 === 1 ? 'Microsoft' : 'Freelance',
        purpose: purposes[i % purposes.length],
        hostId: host._id,
        status: i % 4 === 0 ? 'PENDING' : i % 4 === 3 ? 'REJECTED' : 'APPROVED',
        userId: userId,
        createdAt: new Date(Date.now() - (19 - i) * 24 * 60 * 60 * 1000) // spread out over the last 20 days
      });
      visitors.push(visitor);
    }

    // 5. Create Sample Appointments & Passes & CheckLogs
    console.log('Seeding Appointments, Passes and CheckLogs...');
    
    for (let i = 0; i < visitors.length; i++) {
      const visitor = visitors[i];
      const host = employees[i % employees.length];
      
      const appointmentDate = new Date(Date.now() - (10 - (i % 15)) * 24 * 60 * 60 * 1000); // offset dates
      const app = await Appointment.create({
        visitorId: visitor._id,
        employeeId: host._id,
        visitDate: appointmentDate,
        visitTime: `${9 + (i % 8)}:00`,
        purpose: visitor.purpose,
        approvalStatus: visitor.status
      });

      // If approved, create Pass
      if (visitor.status === 'APPROVED') {
        const passNumber = `VP-${appointmentDate.toISOString().slice(0, 10).replace(/-/g, '')}-${1000 + i}`;
        
        // Mock QR Code Data URL (standard format)
        const mockQR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        
        const pass = await Pass.create({
          passNumber,
          visitorId: visitor._id,
          appointmentId: app._id,
          qrCode: mockQR,
          pdfPath: `src/uploads/passes/pass-${passNumber}.pdf`,
          issueDate: appointmentDate,
          expiryDate: appointmentDate,
          active: appointmentDate >= new Date() // Active only if date is today or in the future
        });

        // Add CheckLogs for past visits
        if (appointmentDate < new Date()) {
          const checkInTime = new Date(appointmentDate);
          checkInTime.setHours(9 + (i % 8), 15, 0); // e.g. checked in 15 mins late

          const checkOutTime = new Date(appointmentDate);
          checkOutTime.setHours(11 + (i % 8), 45, 0); // checked out a few hours later

          await CheckLog.create({
            visitorId: visitor._id,
            appointmentId: app._id,
            checkInTime,
            checkOutTime,
            securityId: securityStaff[i % securityStaff.length]._id
          });
        }
      }
    }

    console.log('--- DATABASE SEEDED SUCCESSFULLY ---');
    console.log('Admin Login: admin@visitorpass.com / password123');
    console.log('Employee Login: employee1@visitorpass.com / password123');
    console.log('Security Login: security1@visitorpass.com / password123');
    console.log('Visitor Login: visitor1@visitorpass.com / password123');
    console.log('------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDB();
