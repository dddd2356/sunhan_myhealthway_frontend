// 로그인 컴포넌트
import {useState} from "react";
import { LogIn, User} from "lucide-react";
import { apiService } from '../../apis/apiService';
import '../HospitalSystem/style.css';
import PasswordModal from "../PasswordModalProps";

interface UserInfo {
    userId: string;
    userName?: string;
    token: string;
    deptCode?: string;
    /** 관리자 계정이면 true */
    isAdmin: boolean;
}

const LoginScreen: React.FC<{ onLogin: (user: UserInfo) => void }> = ({ onLogin }) => {
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 관리자 로그인 모달 관련 상태
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [adminUserId, setAdminUserId] = useState('');
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminError, setAdminError] = useState('');

    const handleLogin = async (e?: any) => {
        if (e) e.preventDefault();
        if (!userId.trim()) {
            setError('아이디를 입력해주세요');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await apiService.login(userId);

            // 관리자 계정인 경우 비밀번호 모달 표시
            if ('requirePassword' in result && result.requirePassword) {
                setAdminUserId(userId);
                setShowPasswordModal(true);
                setLoading(false);
                return;
            }

            // 일반 사용자 로그인 성공
            onLogin(result as UserInfo);
        } catch (err) {
            setError(err instanceof Error ? err.message : '로그인에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (password: string) => {
        setAdminLoading(true);
        setAdminError('');

        try {
            const adminUser = await apiService.adminLogin(adminUserId, password);
            setShowPasswordModal(false);
            onLogin(adminUser);
        } catch (err) {
            setAdminError(err instanceof Error ? err.message : '관리자 로그인에 실패했습니다');
        } finally {
            setAdminLoading(false);
        }
    };

    const handlePasswordModalClose = () => {
        setShowPasswordModal(false);
        setAdminUserId('');
        setAdminError('');
        setUserId('');
    };


    return (
        <>
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-icon">
                        <img src="/newExecution.ico" alt="병원 아이콘"/>
                    </div>
                    <h1 className="login-title">선한병원 건강정보고속도로</h1>
                    <p className="login-subtitle">의료진 전용 시스템</p>
                </div>

                <div className="login-form">
                    <div className="form-group">
                        <label className="form-label">
                            아이디
                        </label>
                        <div className="input-wrapper">
                            <User className="input-icon" />
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                                className="form-input"
                                placeholder="아이디를 입력하세요"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="error-message">
                            <p>{error}</p>
                        </div>
                    )}

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="login-button"
                    >
                        <LogIn className="w-5 h-5" />
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                </div>
            </div>
        </div>
            {/* 관리자 비밀번호 입력 모달 */}
            {showPasswordModal && (
                <PasswordModal
                    isOpen={showPasswordModal}
                    userId={adminUserId}
                    onClose={handlePasswordModalClose}
                    onSubmit={handlePasswordSubmit}
                    loading={adminLoading}
                    error={adminError}
                />
            )}
        </>
    );
};

export default LoginScreen;