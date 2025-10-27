import { Card } from "@/components/Card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AddProductForm } from "@/components/AddProductForm";
import styles from "./AddProductScreen.module.css";

export function AddProductScreen(): JSX.Element {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.badge}>Новый продукт</span>
          <h1 className={styles.title}>Добавьте продукт по модели</h1>
          <p className={styles.subtitle}>
            Выберите модель питания, уточните порцию и распределите нутриенты. Мы сохраняем формат
            так, чтобы команде легко было готовить и планировать закупки.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <main className={styles.content}>
        <Card className={styles.formCard}>
          <AddProductForm />
        </Card>

        <aside className={styles.preview}>
          <h2 className={styles.previewTitle}>Превью карточки</h2>
          <p className={styles.previewDescription}>
            Автоматически обновляется по мере заполнения. Здесь же появится рекомендация по
            сервировке, как только вы сохраните блюдо.
          </p>
          <ul className={styles.previewList}>
            <li>
              <span className={styles.previewLabel}>Модель</span>
              <span className={styles.previewValue}>Сбалансированная классика</span>
            </li>
            <li>
              <span className={styles.previewLabel}>Порция</span>
              <span className={styles.previewValue}>150 г</span>
            </li>
            <li>
              <span className={styles.previewLabel}>КБЖУ</span>
              <span className={styles.previewValue}>132 / 18 / 7 / 12</span>
            </li>
          </ul>

          <div className={styles.tip}>
            <span className={styles.tipTitle}>Подсказка</span>
            <p>
              Нажмите «Автозаполнение ИИ», чтобы система предложила нутриенты по описанию блюда и
              вашим базовым моделям. Функция появится в следующем релизе.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
