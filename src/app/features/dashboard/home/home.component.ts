import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersIcon } from "@app/components/ui/icons/users/users.icon";
import { MetricCardComponent } from '@app/components/card/metric-card.component';

interface ProjectStats {
  total: number;
  ended: number;
  running: number;
  pending: number;
}

interface Project {
  id: number;
  name: string;
  dueDate: string;
  icon: string;
  color: string;
}

interface Reminder {
  title: string;
  time: string;
}

interface TeamMember {
  name: string;
  avatar: string;
  workingOn: string;
  status: 'Completed' | 'In Progress' | 'Pending';
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, /*UsersIcon,*/ MetricCardComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  projectStats: ProjectStats = {
    total: 24,
    ended: 10,
    running: 12,
    pending: 2
  };

  projects: Project[] = [
    { id: 1, name: 'Develop API Endpoints', dueDate: 'Nov 26, 2024', icon: '⚡', color: '#4F46E5' },
    { id: 2, name: 'Onboarding Flow', dueDate: 'Nov 28, 2024', icon: '🎯', color: '#0891B2' },
    { id: 3, name: 'Build Dashboard', dueDate: 'Nov 30, 2024', icon: '🎨', color: '#059669' },
    { id: 4, name: 'Optimize Page Load', dueDate: 'Dec 6, 2024', icon: '⚡', color: '#F59E0B' },
    { id: 5, name: 'Cross-Browser Testing', dueDate: 'Dec 6, 2024', icon: '🔍', color: '#8B5CF6' }
  ];

  reminder: Reminder = {
    title: 'Meeting with Arc Company',
    time: '02:00 pm - 04:00 pm'
  };

  teamMembers: TeamMember[] = [
    { name: 'Alexandra Deff', avatar: '👩🏻‍💼', workingOn: 'Github Project Repository', status: 'Completed' },
    { name: 'Edwin Adenike', avatar: '👨🏽‍💼', workingOn: 'Integrating User Authentication System', status: 'In Progress' }
  ];

  analyticsData = [
    { day: 'S', value: 45 },
    { day: 'M', value: 78 },
    { day: 'T', value: 68 },
    { day: 'W', value: 85 },
    { day: 'T', value: 42 },
    { day: 'F', value: 38 },
    { day: 'S', value: 52 }
  ];

  projectProgress = 68;

  ngOnInit(): void {
    console.log('Dashboard loaded');
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'Completed': 'bg-green-100 text-green-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Pending': 'bg-gray-100 text-gray-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }
}
