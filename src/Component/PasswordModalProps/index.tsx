import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

interface PasswordModalProps {
    isOpen: boolean;
    userId: string;
    onClose: () => void;
    onSubmit: (password: string) => void;
    loading?: boolean;
    error?: string;
}

const PasswordModal: React.FC<PasswordModalProps> = ({
                                                         isOpen,
                                                         userId,
                                                         onClose,
                                                         onSubmit,
                                                         loading = false,
                                                         error = ''
                                                     }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password.trim()) {
            onSubmit(password);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content password-modal"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                <div className="modal-header">
                    <h3>관리자 인증</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="modal-close-button"
                        disabled={loading}
                    >
                        <X/>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <p className="modal-description">
                        관리자 계정 <strong>{userId}</strong>의 비밀번호를 입력해주세요.
                    </p>

                    <div className="form-group">
                        <label className="form-label">비밀번호</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-input"
                                placeholder="비밀번호를 입력하세요"
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="error-message">
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="modal-cancel-button"
                            disabled={loading}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="modal-submit-button"
                            disabled={loading || !password.trim()}
                        >
                            {loading ? '로그인 중...' : '로그인'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordModal;