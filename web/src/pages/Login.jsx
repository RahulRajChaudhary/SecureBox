import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { staggerContainer, staggerItem, quick } from '../lib/motion';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <motion.form
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-edge bg-surface p-6"
      >
        <motion.h1 variants={staggerItem} transition={quick} className="mb-4 text-lg font-semibold text-ink">
          Log in
        </motion.h1>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}

        <div className="flex flex-col gap-3">
          <motion.label variants={staggerItem} transition={quick} className="flex flex-col gap-1 text-sm text-muted">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-md border border-edge bg-bg px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent"
            />
          </motion.label>
          <motion.label variants={staggerItem} transition={quick} className="flex flex-col gap-1 text-sm text-muted">
            Password
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md border border-edge bg-bg px-3 py-2 pr-9 text-sm text-ink outline-none transition-colors focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-ink"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </motion.label>

          <motion.button
            variants={staggerItem}
            transition={quick}
            type="submit"
            disabled={submitting}
            whileTap={{ scale: 0.98 }}
            className="mt-1 rounded-md bg-accent px-3 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent-dim disabled:opacity-50"
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </motion.button>

          <motion.p variants={staggerItem} transition={quick} className="text-center text-sm text-muted">
            No account?{' '}
            <Link to="/register" className="text-accent hover:underline">
              Register
            </Link>
          </motion.p>
        </div>
      </motion.form>
    </AuthLayout>
  );
}
