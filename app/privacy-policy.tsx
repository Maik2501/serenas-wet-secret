import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function PrivacyPolicyScreen() {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft color="#1E293B" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.lastUpdated}>Last Updated: December 2024</Text>

                <Text style={styles.sectionTitle}>Your Privacy Matters 💜</Text>
                <Text style={styles.paragraph}>
                    Tear Track Journal is designed with your privacy as a top priority. We believe your
                    emotional journey is deeply personal, and we've built this app to keep it that way.
                </Text>

                <Text style={styles.sectionTitle}>Data Storage</Text>
                <Text style={styles.paragraph}>
                    <Text style={styles.bold}>All your data stays on your device.</Text> Your journal entries,
                    crying records, and statistics are stored locally using AsyncStorage. We do not have
                    access to any of your personal data, and nothing is uploaded to external servers.
                </Text>

                <Text style={styles.sectionTitle}>What We Don't Collect</Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bulletItem}>• Your journal entries</Text>
                    <Text style={styles.bulletItem}>• Your emotional data or crying records</Text>
                    <Text style={styles.bulletItem}>• Personal identifying information</Text>
                    <Text style={styles.bulletItem}>• Location data</Text>
                    <Text style={styles.bulletItem}>• Contacts or photos</Text>
                </View>

                <Text style={styles.sectionTitle}>Notifications</Text>
                <Text style={styles.paragraph}>
                    If you grant notification permissions, we use local notifications only. These are
                    scheduled directly on your device to remind you about your emotional wellness.
                    No notification data leaves your phone.
                </Text>

                <Text style={styles.sectionTitle}>In-App Purchases</Text>
                <Text style={styles.paragraph}>
                    If you choose to support the app through donations, payment processing is handled
                    securely by Apple (App Store) or Google (Play Store). We do not have access to your
                    payment details.
                </Text>

                <Text style={styles.sectionTitle}>Third-Party Services</Text>
                <Text style={styles.paragraph}>
                    We use RevenueCat for managing in-app purchases. RevenueCat may collect anonymized
                    purchase analytics. For their privacy practices, please refer to{' '}
                    <Text style={styles.link}>revenuecat.com/privacy</Text>.
                </Text>

                <Text style={styles.sectionTitle}>Data Deletion</Text>
                <Text style={styles.paragraph}>
                    Since all data is stored locally on your device, you can delete all app data at any
                    time by uninstalling the app or clearing the app data through your device settings.
                </Text>

                <Text style={styles.sectionTitle}>Changes to This Policy</Text>
                <Text style={styles.paragraph}>
                    We may update this privacy policy from time to time. Any changes will be reflected
                    in the "Last Updated" date above.
                </Text>

                <Text style={styles.sectionTitle}>Contact</Text>
                <Text style={styles.paragraph}>
                    If you have any questions about this privacy policy, please reach out to us through
                    the app's support channels.
                </Text>

                <View style={styles.footer}>
                    <Text style={styles.footerEmoji}>🔒</Text>
                    <Text style={styles.footerText}>Your tears, your privacy.</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
    },
    placeholder: {
        width: 40,
    },
    content: {
        padding: 24,
        paddingBottom: 60,
    },
    lastUpdated: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 24,
        fontStyle: 'italic',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 24,
        marginBottom: 12,
    },
    paragraph: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 24,
    },
    bold: {
        fontWeight: '700',
        color: '#1E293B',
    },
    bulletList: {
        marginTop: 8,
        gap: 8,
    },
    bulletItem: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 22,
        paddingLeft: 8,
    },
    link: {
        color: '#8B5CF6',
        textDecorationLine: 'underline',
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
        paddingVertical: 24,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    footerEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    footerText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
});
