# pdzanning

A lightweight planning app that unifies **Kanban**, **Table**, and **Gantt** views for the same Task data, with simple people assignment, priorities, due dates, progress tracking, subtasks and cross-task references — plus **one-click export/import to JSON** so users can share or backup entire plans.

## 🚀 Features

### Core Features
- **Multi-view Interface**: Switch between Kanban board, Table view, and Gantt chart
- **Task Management**: Create, update, delete tasks with rich metadata
- **User Assignment**: Assign multiple users to tasks
- **Priority & Status Tracking**: Visual indicators for task priority and status
- **Progress Tracking**: Visual progress bars and percentage tracking
- **Dependencies**: Link tasks with dependency relationships
- **Subtasks**: Create hierarchical task structures
- **Export/Import**: JSON-based plan export and import functionality

### Views
- **Kanban Board**: Drag-and-drop task management with status columns
- **Table View**: Sortable, filterable task list with bulk operations
- **Gantt Chart**: Timeline view with dependencies and progress visualization

### Technical Features
- **Real-time Updates**: Optimistic UI with server reconciliation
- **Responsive Design**: Works on desktop and mobile devices
- **Secure Authentication**: JWT-based authentication with refresh tokens
- **Data Validation**: Client and server-side validation with Zod
- **Type Safety**: Full TypeScript implementation

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Query** for server state management
- **Zustand** for client state management
- **@dnd-kit** for drag-and-drop functionality
- **D3.js** for Gantt chart rendering

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **MongoDB Atlas** for data storage
- **Mongoose** for MongoDB object modeling
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Zod** for runtime validation

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pdzanning
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Setup**
   
   Copy the backend environment file:
   ```bash
   cp backend/env.example backend/.env
   ```
   
   Update `backend/.env` with your configuration:
   ```env
   MONGODB_URI=mongodb+srv://... 
   JWT_ACCESS_SECRET=your-super-secret-access-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ALLOWED_ORIGINS=http://localhost:5173
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API server on http://localhost:3001
   - Frontend development server on http://localhost:5173

## 🎯 Usage

### Getting Started

1. **Create an Account**: Register with your email and password
2. **Create a Plan**: Enter a plan ID to create or access a plan
3. **Add Tasks**: Click "New Task" to create tasks with:
   - Title and description
   - Status (To Do, In Progress, Done)
   - Priority (Low, Medium, High, Urgent)
   - Assignees
   - Start and due dates
   - Progress percentage
   - Tags
   - Time estimates

### Views

#### Kanban Board
- Drag tasks between status columns
- Visual task cards with priority, progress, and assignee avatars
- Real-time updates

#### Table View
- Sortable columns
- Bulk selection and operations
- Advanced filtering
- Detailed task information

#### Gantt Chart
- Timeline visualization
- Zoom levels (Day, Week, Month)
- Dependency arrows
- Progress bars
- Today indicator

### Export/Import

- **Export**: Download your entire plan as JSON
- **Import**: Upload a JSON file to recreate a plan
- **Sharing**: Share JSON files with team members

## 🏗 Architecture

### Data Model

The application uses two core entities:

#### User
```typescript
{
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  plan_roles?: Record<string, 'owner' | 'editor' | 'viewer'>;
}
```

#### Task
```typescript
{
  _id: string;
  plan_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignee_ids?: string[];
  start_date?: string;
  due_date?: string;
  progress_pct?: number;
  parent_id?: string;
  dependency_ids?: string[];
  tags?: string[];
  estimate_hours?: number;
}
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

#### Tasks
- `GET /api/tasks` - Get tasks with filtering and pagination
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/bulk` - Bulk create tasks
- `POST /api/tasks/reorder` - Reorder tasks

#### Plans
- `GET /api/plans/:id/export` - Export plan as JSON
- `POST /api/plans/import` - Import plan from JSON

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# Run e2e tests (if configured)
npm run test:e2e
```

## 🚀 Deployment

### Backend Deployment

1. **Build the backend**
   ```bash
   cd backend
   npm run build
   ```

2. **Set production environment variables**
   ```env
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   JWT_ACCESS_SECRET=your-production-secret
   JWT_REFRESH_SECRET=your-production-refresh-secret
   ```

3. **Deploy to your hosting platform**
   - Heroku
   - Railway
   - DigitalOcean
   - AWS

### Frontend Deployment

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to static hosting**
   - Vercel
   - Netlify
   - GitHub Pages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [MongoDB](https://www.mongodb.com/) - Database
- [@dnd-kit](https://dndkit.com/) - Drag and drop
- [D3.js](https://d3js.org/) - Data visualization

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation
- Contact the maintainers

---

**pdzanning** - Planning made simple! 🎯

