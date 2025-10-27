import { FormEvent, useMemo } from "react";
import { Button } from "@/components/Button";
import styles from "./AddProductForm.module.css";

type AddProductFormProps = {
  onSubmit?: (data: Record<string, string>) => void;
};

type NutrientField = {
  id: string;
  label: string;
  unit: string;
  placeholder: string;
  Icon: () => JSX.Element;
};

function ProteinIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={styles.icon}>
      <path
        d="M6.5 3.5c1.8-1.6 4.2-1.6 6 0l6 5.4a3.7 3.7 0 0 1 .5 5.1l-6.2 8.1a2 2 0 0 1-3.1 0L3.5 14c-1.3-1.6-1-4 .6-5.3z"
        fill="currentColor"
      />
      <path
        d="M12 6.25c-1.55 0-2.8 1.25-2.8 2.8s1.25 2.8 2.8 2.8 2.8-1.25 2.8-2.8S13.55 6.25 12 6.25zm0 4c-.66 0-1.2-.54-1.2-1.2s.54-1.2 1.2-1.2 1.2.54 1.2 1.2-.54 1.2-1.2 1.2z"
        fill="var(--color-icon-container)"
      />
    </svg>
  );
}

function FatIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={styles.icon}>
      <path
        d="M12 3c2.28 2.88 3.5 5.33 3.5 7.38 0 2.38-1.62 4.62-3.5 4.62s-3.5-2.24-3.5-4.62C8.5 8.33 9.72 5.88 12 3z"
        fill="currentColor"
      />
      <path
        d="M17.2 13.8c-.6 3.38-3 5.7-5.2 5.7s-4.6-2.32-5.2-5.7"
        stroke="var(--color-icon-container-strong)"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function CarbsIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={styles.icon}>
      <rect
        x="3.5"
        y="7"
        width="17"
        height="11"
        rx="3"
        ry="3"
        fill="currentColor"
      />
      <rect
        x="6"
        y="4.5"
        width="12"
        height="5"
        rx="2"
        ry="2"
        fill="var(--color-icon-container)"
      />
      <circle cx="12" cy="12.5" r="1.6" fill="var(--color-icon-container-strong)" />
    </svg>
  );
}

function CaloriesIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={styles.icon}>
      <path
        d="M12 2.8c1.9 2.3 2.8 4.25 2.8 6.1 0 1.45-.58 2.65-1.43 3.5 2.06-.35 3.93-2.09 3.93-4.7 0-1.2-.38-2.38-1.13-3.54-.3-.48.23-1.02.73-.72C19.4 4.92 21 7.6 21 10.7 21 16.1 16.97 20 12 20s-9-3.9-9-9.3c0-2.82 1.35-5.25 3.47-6.84.5-.38 1.16.17.88.73C6.5 5.9 6.2 7 6.2 8.2c0 2.6 1.87 4.34 3.93 4.7-.85-.85-1.43-2.05-1.43-3.5 0-1.85.9-3.8 2.8-6.1z"
        fill="currentColor"
      />
    </svg>
  );
}

function SparklesIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={styles.icon}>
      <path
        d="M12 4.5 13.4 9l4.6 1.4-4.6 1.4L12 16.3 10.6 11.8 6 10.4l4.6-1.4z"
        fill="currentColor"
      />
      <path
        d="M6.8 4.2 7.6 6l1.8.8L7.6 7.6 6.8 9.4 6 7.6 4.2 6.8 6 6zM16.8 16.2l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"
        fill="var(--color-icon-container-strong)"
      />
    </svg>
  );
}

function SaveIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={styles.icon}>
      <path
        d="M5.5 3h9.3c.4 0 .8.16 1.06.44l3.7 3.78c.28.28.44.66.44 1.06V19a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
        fill="currentColor"
      />
      <path
        d="M8 3v4.5h8V5.4l-1.4-1.4z"
        fill="var(--color-icon-container)"
      />
      <rect x="8" y="13" width="8" height="6" rx="1.2" fill="var(--color-icon-container-strong)" />
    </svg>
  );
}

export function AddProductForm({ onSubmit }: AddProductFormProps): JSX.Element {
  const nutrientFields = useMemo<NutrientField[]>(
    () => [
      {
        id: "calories",
        label: "Калории",
        unit: "ккал",
        placeholder: "132",
        Icon: CaloriesIcon
      },
      {
        id: "protein",
        label: "Белки",
        unit: "г",
        placeholder: "18",
        Icon: ProteinIcon
      },
      {
        id: "fat",
        label: "Жиры",
        unit: "г",
        placeholder: "7",
        Icon: FatIcon
      },
      {
        id: "carbs",
        label: "Углеводы",
        unit: "г",
        placeholder: "12",
        Icon: CarbsIcon
      }
    ],
    []
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const entries = Object.fromEntries(formData.entries());
    onSubmit?.(Object.fromEntries(Object.entries(entries).map(([key, value]) => [key, String(value)])));
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.group}>
        <label className={styles.label} htmlFor="model">
          Модель рациона
        </label>
        <div className={styles.selectWrapper}>
          <select className={styles.select} id="model" name="model" defaultValue="balanced">
            <option value="balanced">Сбалансированная классика</option>
            <option value="vegan">Растительный рацион</option>
            <option value="fitness">Фитнес с повышенным белком</option>
            <option value="keto">Кето акцент</option>
          </select>
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label} htmlFor="productName">
          Название продукта
        </label>
        <div className={styles.inputWrapper}>
          <input
            className={styles.input}
            id="productName"
            name="productName"
            placeholder="Например, куриная грудка"
            required
          />
        </div>
      </div>

      <div className={styles.inlineGroup}>
        <div className={styles.group}>
          <label className={styles.label} htmlFor="portion">
            Порция
          </label>
          <div className={styles.inputWrapper}>
            <input
              className={styles.input}
              id="portion"
              name="portion"
              type="number"
              min="0"
              step="1"
              placeholder="150"
            />
            <span className={styles.unit}>грамм</span>
          </div>
        </div>

        <div className={styles.group}>
          <label className={styles.label} htmlFor="mealTime">
            Приём пищи
          </label>
          <div className={styles.selectWrapper}>
            <select className={styles.select} id="mealTime" name="mealTime" defaultValue="lunch">
              <option value="breakfast">Завтрак</option>
              <option value="lunch">Обед</option>
              <option value="snack">Перекус</option>
              <option value="dinner">Ужин</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.nutrients}>
        {nutrientFields.map(({ id, label, unit, placeholder, Icon }) => (
          <label key={id} className={styles.nutrient} htmlFor={id}>
            <span className={styles.nutrientIcon}>
              <Icon />
            </span>
            <span className={styles.nutrientLabel}>{label}</span>
            <div className={styles.nutrientInput}>
              <input
                className={styles.input}
                id={id}
                name={id}
                inputMode="decimal"
                placeholder={placeholder}
                type="number"
                min="0"
                step="0.1"
              />
              <span className={styles.unit}>{unit}</span>
            </div>
          </label>
        ))}
      </div>

      <div className={styles.group}>
        <label className={styles.label} htmlFor="notes">
          Комментарий для повара
        </label>
        <div className={styles.inputWrapper}>
          <textarea
            className={styles.textarea}
            id="notes"
            name="notes"
            rows={4}
            placeholder="Например: обжарить на гриле без масла и добавить свежую зелень."
          />
        </div>
      </div>

      <div className={styles.footer}>
        <Button type="submit" leadingIcon={<SaveIcon />}>
          Добавить продукт
        </Button>
        <Button
          type="button"
          variant="outlined"
          className={styles.aiButton}
          leadingIcon={<SparklesIcon />}
        >
          Автозаполнение ИИ
        </Button>
      </div>
    </form>
  );
}
