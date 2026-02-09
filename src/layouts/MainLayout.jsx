import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Bell, Search } from 'lucide-react';

const MainLayout = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="page-wrapper">
          <Outlet />
        </div>
      </main>

      <style>{`
        /* Header styles removed */


        
        .icon-btn {
            color: var(--text-secondary);
            padding: 10px;
            border-radius: 50%;
            transition: all 0.2s;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid transparent;
        }
        
        .icon-btn:hover {
            color: #bef264;
            background-color: rgba(190, 242, 100, 0.1);
            border-color: rgba(190, 242, 100, 0.2);
            box-shadow: 0 0 15px rgba(190, 242, 100, 0.2);
        }

        .page-wrapper {
          flex: 1;
          overflow-y: auto;
          position: relative;
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
