import { useMemo } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { getLocalizedUnitLabel } from "../../../shared/lib/units";
import { getMacroColor } from "../../../shared/theme/macroColors";
import { useMobileI18n } from "../app/MobileI18nProvider";

type HomeScreenProps = {
  isDarkMode: boolean;
};

const sectionKeys = ["nav.mealPlan", "nav.recipes", "nav.shopping", "nav.settings"] as const;

export function HomeScreen({ isDarkMode }: HomeScreenProps) {
  const { language, setLanguage, supportedLanguages, isRtl, t } = useMobileI18n();
  const styles = useMemo(() => createStyles(isDarkMode, isRtl), [isDarkMode, isRtl]);
  const kcalLabel = getLocalizedUnitLabel((key) => t(key as never), "kcal");
  const gramsLabel = getLocalizedUnitLabel((key) => t(key as never), "g");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>SmartFoodPlan</Text>
            <Text style={styles.subtitle}>{t("mealPlan.dashboard.subtitle")}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>RN</Text>
          </View>
        </View>

        <View style={styles.controlSection}>
          <Text style={styles.sectionTitle}>{t("language.label")}</Text>
          <View style={styles.languageRow}>
            {supportedLanguages.map((languageOption) => {
              const selected = languageOption === language;
              return (
                <Pressable
                  key={languageOption}
                  onPress={() => setLanguage(languageOption)}
                  style={[styles.languageChip, selected ? styles.languageChipActive : null]}
                >
                  <Text style={[styles.languageChipText, selected ? styles.languageChipTextActive : null]}>
                    {languageOption.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("mealPlan.cards.totalCalories")}</Text>
          <Text style={styles.metricValue}>1840 {kcalLabel}</Text>
          <Text style={styles.metricHint}>{t("mealPlan.cards.used")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("mealPlan.section.macroBalance")}</Text>
          <View style={styles.macroList}>
            {[
              { key: "mealPlan.macro.protein" as const, value: 124, color: getMacroColor("protein") },
              { key: "mealPlan.macro.fat" as const, value: 58, color: getMacroColor("fat") },
              { key: "mealPlan.macro.carbs" as const, value: 176, color: getMacroColor("carbs") }
            ].map((macro) => (
              <View key={macro.key} style={styles.macroRow}>
                <View style={[styles.macroDot, { backgroundColor: macro.color }]} />
                <Text style={styles.macroLabel}>{t(macro.key)}</Text>
                <Text style={styles.macroValue}>{macro.value} {gramsLabel}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("nav.overview")}</Text>
          <View style={styles.sectionGrid}>
            {sectionKeys.map((key) => (
              <View key={key} style={styles.sectionCard}>
                <Text style={styles.sectionCardTitle}>{t(key)}</Text>
                <Text style={styles.sectionCardHint}>{t("common.comingSoon")}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(isDarkMode: boolean, isRtl: boolean) {
  const colors = isDarkMode
    ? {
        background: "#0b1422",
        card: "#111c2d",
        cardSecondary: "#162233",
        text: "#f8fafc",
        muted: "#94a3b8",
        border: "rgba(148,163,184,0.18)",
        accent: "#10b981",
        accentSoft: "rgba(16,185,129,0.16)"
      }
    : {
        background: "#f4f7f9",
        card: "#ffffff",
        cardSecondary: "#f8fbfc",
        text: "#0f172a",
        muted: "#64748b",
        border: "rgba(148,163,184,0.24)",
        accent: "#10b981",
        accentSoft: "rgba(16,185,129,0.12)"
      };

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background
    },
    content: {
      padding: 20,
      gap: 16
    },
    header: {
      flexDirection: isRtl ? "row-reverse" : "row",
      alignItems: "flex-start",
      justifyContent: "space-between"
    },
    headerTextBlock: {
      flex: 1
    },
    title: {
      fontSize: 30,
      fontWeight: "800",
      color: colors.text,
      textAlign: isRtl ? "right" : "left"
    },
    subtitle: {
      marginTop: 6,
      fontSize: 15,
      lineHeight: 22,
      color: colors.muted,
      textAlign: isRtl ? "right" : "left"
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.accentSoft
    },
    badgeText: {
      color: colors.accent,
      fontWeight: "800"
    },
    controlSection: {
      gap: 10
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.muted,
      textAlign: isRtl ? "right" : "left"
    },
    languageRow: {
      flexDirection: isRtl ? "row-reverse" : "row",
      flexWrap: "wrap",
      gap: 8
    },
    languageChip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border
    },
    languageChipActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent
    },
    languageChipText: {
      color: colors.text,
      fontWeight: "700"
    },
    languageChipTextActive: {
      color: colors.accent
    },
    card: {
      padding: 18,
      borderRadius: 22,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
      textAlign: isRtl ? "right" : "left"
    },
    metricValue: {
      fontSize: 36,
      fontWeight: "900",
      color: colors.text,
      textAlign: isRtl ? "right" : "left"
    },
    metricHint: {
      fontSize: 14,
      color: colors.muted,
      textAlign: isRtl ? "right" : "left"
    },
    macroList: {
      gap: 10
    },
    macroRow: {
      flexDirection: isRtl ? "row-reverse" : "row",
      alignItems: "center",
      gap: 10
    },
    macroDot: {
      width: 10,
      height: 10,
      borderRadius: 999
    },
    macroLabel: {
      flex: 1,
      color: colors.text,
      fontWeight: "700",
      textAlign: isRtl ? "right" : "left"
    },
    macroValue: {
      color: colors.muted,
      fontWeight: "700"
    },
    sectionGrid: {
      gap: 10
    },
    sectionCard: {
      padding: 14,
      borderRadius: 18,
      backgroundColor: colors.cardSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6
    },
    sectionCardTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "800",
      textAlign: isRtl ? "right" : "left"
    },
    sectionCardHint: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      textAlign: isRtl ? "right" : "left"
    }
  });
}
