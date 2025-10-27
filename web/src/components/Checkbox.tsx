import { ChangeEvent } from "react";
import styles from "./Checkbox.module.css";

type CheckboxProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function Checkbox({ id, label, checked, onChange }: CheckboxProps): JSX.Element {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <label className={styles.checkbox} htmlFor={id}>
      <input
        className={styles.checkboxInput}
        id={id}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
      />
      <span className={styles.control}>
        {checked && (
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M10.9994 1L4.2494 8L1 4.54545"
              stroke="var(--color-background)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className={styles.labelText}>{label}</span>
    </label>
  );
}
