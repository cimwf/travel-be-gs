import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import styles from './index.module.scss';

interface LoginForm {
  username: string;
  password: string;
  remember: boolean;
}

interface LocationState {
  from?: { pathname: string };
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true);

    try {
      const success = await login(values.username, values.password);

      if (success) {
        message.success('登录成功');
        const from = (location.state as LocationState)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        message.error('请输入用户名和密码');
      }
    } catch {
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* 背景装饰 */}
      <div className={styles.bgDecoration1} />
      <div className={styles.bgDecoration2} />

      <div className={styles.content}>
        {/* 左侧品牌区域 */}
        <div className={styles.brandSection}>
          <div className={styles.brandLogo}>
            <span className={styles.logoIcon}>🏔️</span>
            <span className={styles.logoText}>北京旅行</span>
          </div>
          <p className={styles.brandDesc}>
            一站式北京旅游服务平台<br />让每一次出行都成为美好回忆
          </p>

          <div className={styles.features}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>📊</div>
              <div className={styles.featureContent}>
                <h4>数据驱动决策</h4>
                <p>实时运营数据大屏，让决策更精准</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>🎯</div>
              <div className={styles.featureContent}>
                <h4>智能运营管理</h4>
                <p>景点、订单、用户一站式管理</p>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧登录卡片 */}
        <div className={styles.loginSection}>
          <div className={styles.loginCard}>
            <div className={styles.cardHeader}>
              <h2>欢迎回来</h2>
              <p>登录您的管理员账号</p>
            </div>

            <Form
              name="login"
              initialValues={{ remember: true }}
              onFinish={handleSubmit}
              size="large"
              className={styles.loginForm}
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: 'var(--gray-400)' }} />}
                  placeholder="请输入用户名"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input
                  prefix={<LockOutlined style={{ color: 'var(--gray-400)' }} />}
                  suffix={
                    <span
                      className={styles.eyeIcon}
                      onClick={() => setPasswordVisible(!passwordVisible)}
                    >
                      {passwordVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </span>
                  }
                  type={passwordVisible ? 'text' : 'password'}
                  placeholder="请输入密码"
                />
              </Form.Item>

              <Form.Item>
                <div className={styles.formOptions}>
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>记住我</Checkbox>
                  </Form.Item>
                  <a className={styles.forgotLink}>忘记密码？</a>
                </div>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className={styles.submitBtn}
                >
                  登 录
                </Button>
              </Form.Item>
            </Form>

            <div className={styles.divider}>
              <span>其他方式</span>
            </div>

            <div className={styles.otherMethods}>
              <Button block>📱 短信验证</Button>
              <Button block>🔐 企业微信</Button>
            </div>

            <div className={styles.cardFooter}>
              <span>还没有账号？</span>
              <a>联系管理员开通</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
