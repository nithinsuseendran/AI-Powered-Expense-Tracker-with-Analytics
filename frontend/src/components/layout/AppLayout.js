import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatPanel from '../chat/ChatPanel';

const AppLayout = () => {
    const [chatOpen, setChatOpen] = useState(true);

    return (
        <div className="app-layout">
            <Sidebar />
            <main className={`main-content ${chatOpen ? 'with-chat' : ''}`}>
                <Outlet context={{ chatOpen, setChatOpen }} />
            </main>
            <ChatPanel isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
        </div>
    );
};

export default AppLayout;
