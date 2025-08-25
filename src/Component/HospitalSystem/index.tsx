// 메인 앱 컴포넌트
import {useEffect, useState} from "react";
import LoginScreen from "../LoginScreen";
import './style.css';
import PatientDashboard from "../PatientDashboard";
import { UserInfo } from "../PatientDashboard";
import AdminDashboard from "../AdminDashboard";


const HospitalSystem: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);

    useEffect(() => {
        // 리프레시 시 세션스토리지에 로그인 정보가 있으면 자동 로그인
        const userId = sessionStorage.getItem('userId');
        const userName = sessionStorage.getItem('userName') || undefined;
        const token = sessionStorage.getItem('token') || ''; // token도 가져오기
        const deptCode = sessionStorage.getItem('deptCode') || undefined;
        const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
        if (userId) {
            setCurrentUser({ userId, userName, token, deptCode, isAdmin });
        }
    }, []);

    const handleLogin = (user: UserInfo) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        // 세션 스토리지에서 삭제
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('deptCode');
        sessionStorage.removeItem('isAdmin');
        setCurrentUser(null);
    };

    // 로그인되지 않은 경우
    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    if (currentUser.isAdmin) {
        return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
    }

    // 환자 목록 표시
    return (
        <PatientDashboard
            user={currentUser}
            onLogout={handleLogout}
        />
    );
};

export default HospitalSystem;