import React, { useState } from 'react';
import logo from '../assets/logo.png';
import { Form, Input, Button, Typography, Divider, Space } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Link } = Typography;

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (isSignup) {
        await signup(values.email, values.password, values.name);
      } else {
        await login(values.email, values.password);
      }
      navigate('/');
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Something went wrong';
      console.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Brand */}
        <img src={logo} alt="AssetFlow" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', marginBottom: 24 }} />
        <Title level={3} className="login-title" style={{ fontFamily: 'var(--font-display)' }}>
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </Title>
        <Text className="login-subtitle" style={{ display: 'block' }}>
          {isSignup
            ? 'Start managing your enterprise assets'
            : 'Sign in to AssetFlow'}
        </Text>

        {/* Form */}
        <Form layout="vertical" onFinish={handleSubmit} autoComplete="off" size="large">
          {isSignup && (
            <Form.Item
              name="name"
              rules={[{ required: true, message: 'Name is required' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: 'var(--text-muted)' }} />}
                placeholder="Full name"
              />
            </Form.Item>
          )}

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Invalid email' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="Email address"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ height: 48, fontSize: 15, fontWeight: 600 }}
            >
              {isSignup ? 'Create Account' : 'Sign In'}
            </Button>
          </Form.Item>
        </Form>

        <Divider plain style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)', fontSize: 12 }}>
          or
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Link
              onClick={() => setIsSignup(!isSignup)}
              style={{ color: 'var(--primary-light)', fontWeight: 500 }}
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </Link>
          </Text>
        </div>

        {/* Demo Credentials */}
        {!isSignup && (
          <div style={{
            marginTop: 24,
            padding: '12px 16px',
            background: 'var(--primary-ghost)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(6, 182, 212, 0.1)',
          }}>
            <Text style={{ color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
              Demo Credentials
            </Text>
            <Space direction="vertical" size={2} style={{ marginTop: 6, width: '100%' }}>
              <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Admin: admin@assetflow.com / admin123
              </Text>
              <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Manager: manager@assetflow.com / manager123
              </Text>
              <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Employee: arya@assetflow.com / password123
              </Text>
            </Space>
          </div>
        )}
      </div>
    </div>
  );
}
