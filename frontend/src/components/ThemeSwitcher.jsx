import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeSwitcher() {
  const { preference, setTheme } = useTheme();
  const Icon = preference === 'system' ? Monitor : preference === 'dark' ? Moon : Sun;
  return <label className="theme-switcher" title="Chọn giao diện sáng hoặc tối">
    <Icon size={17} aria-hidden="true" />
    <select aria-label="Chế độ giao diện" value={preference} onChange={event => setTheme(event.target.value)}>
      <option value="light">Sáng</option>
      <option value="dark">Tối</option>
      <option value="system">Theo thiết bị</option>
    </select>
  </label>;
}
