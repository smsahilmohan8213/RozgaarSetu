import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { LOCALITIES } from "@/data/jobs";
import { useColors } from "@/hooks/useColors";

const SUGGESTED_SKILLS = [
  "MS Excel", "Tally", "Hindi Typing", "English Speaking", "Sales",
  "Customer Service", "Delivery", "Cooking", "Driving", "Security",
  "Data Entry", "Teaching", "Stitching", "Electrician", "Plumbing",
];

const EDUCATION_OPTIONS = [
  "Below 10th", "10th Pass", "12th Pass", "ITI / Diploma",
  "B.A.", "B.Com", "B.Sc", "B.Tech", "Graduate (Other)", "Post Graduate",
];

const EXPERIENCE_OPTIONS = [
  "Fresher", "Less than 1 year", "1-2 years", "2-3 years",
  "3-5 years", "5-7 years", "7-10 years", "10+ years",
];

const LANGUAGE_OPTIONS = [
  "Hindi / English",
  "Hindi",
  "English",
  "Hinglish",
  "Punjabi",
  "Bengali",
  "Tamil",
  "Marathi",
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, savedJobIds, appliedJobIds, postedJobs, deletePostedJob, updateProfile, setEditingJobId, uploadResumeFromDevice, deleteResumeFromStorage, openResume } = useApp();
  const isWeb = Platform.OS === "web";

  const [showEditModal, setShowEditModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showSeekerCard, setShowSeekerCard] = useState(false);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [editForm, setEditForm] = useState({
    name: user.name,
    bio: user.bio,
    location: user.location,
    education: user.education,
    experience: user.experience,
    language: user.language,
    companyName: user.companyName ?? "",
    companyDescription: user.companyDescription ?? "",
  });

  async function handleLogout() {
    if (Platform.OS === "web") {
      if (window.confirm("Log out of RozgaarSetu?")) await logout();
      return;
    }
    Alert.alert("Log Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => logout() },
    ]);
  }

  function handleDeleteJob(jobId: string, title: string) {
    if (Platform.OS === "web") {
      if (window.confirm(`Delete "${title}"?`)) deletePostedJob(jobId);
      return;
    }
    Alert.alert("Delete Job", `Remove "${title}" from listings?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deletePostedJob(jobId) },
    ]);
  }

  function handleEditJob(jobId: string) {
    setEditingJobId(jobId);
    router.push("/post-job");
  }

  async function handleSaveProfile() {
    await updateProfile(editForm);
    setShowEditModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleAddSkill(skill: string) {
    const trimmed = skill.trim();
    if (!trimmed || user.skills.includes(trimmed)) return;
    await updateProfile({ skills: [...user.skills, trimmed] });
    setNewSkill("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleRemoveSkill(skill: string) {
    await updateProfile({ skills: user.skills.filter((s) => s !== skill) });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleResumeToggle() {
    await updateProfile({ resumeUploaded: !user.resumeUploaded });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleUploadResume() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });

      if (result.canceled || result.assets.length === 0) return;

      const file = result.assets[0];
      await uploadResumeFromDevice({ file: { uri: file.uri, name: file.name } });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Failed to upload resume");
    }
  }

  async function handleDeleteResume() {
    if (Platform.OS === "web") {
      if (window.confirm("Delete your resume?")) {
        await deleteResumeFromStorage();
        setShowResumePreview(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      return;
    }

    Alert.alert("Delete Resume", "Are you sure you want to delete your resume?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteResumeFromStorage();
          setShowResumePreview(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }

  async function handleShareCard() {
    try {
      await Share.share({
        message: `Hi! I'm ${user.name}, a Job Seeker on RozgaarSetu.\n📍 ${user.location}\n💼 ${user.experience}\n🎯 Skills: ${user.skills.slice(0, 3).join(", ") || "—"}\n📞 +91 ${user.phone}\n\nFind me on RozgaarSetu!`,
        title: `${user.name} — RozgaarSetu Job Seeker`,
      });
    } catch (_) {}
  }

  if (!user.isAuthenticated) {
    return <GuestView onSignIn={() => router.push("/auth")} insets={insets} isWeb={isWeb} />;
  }

  const isEmployer = user.role === "employer";
  const nameToUse = isEmployer && user.companyName ? user.companyName : user.name;
  const initials = nameToUse.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  const score = user.profileScore;
  const completionItems = isEmployer ? [
    { label: "Company name", done: !!user.companyName },
    { label: "Company description", done: !!user.companyDescription },
    { label: "Contact person", done: !!user.name },
    { label: "Phone verified", done: !!user.phone },
    { label: "Location set", done: !!user.location },
  ] : [
    { label: "Name set", done: !!user.name },
    { label: "Phone verified", done: !!user.phone },
    { label: "Skills added", done: user.skills && user.skills.length > 0 },
    { label: "Experience added", done: !!user.experience },
    { label: "Education filled", done: !!user.education },
    { label: "Resume uploaded", done: user.resumeUploaded },
  ];

  const qrData = encodeURIComponent(
    `RozgaarSetu Job Seeker: ${user.name}, +91${user.phone}, ${user.location}, Skills: ${user.skills.join(", ")}`
  );
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${qrData}&size=180x180&color=1D4ED8&bgcolor=EEF2FF&qzone=1`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scroll,
        { paddingBottom: isWeb ? 110 : 110 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HERO BANNER ── */}
      <LinearGradient
        colors={["#1D4ED8", "#2563EB", "#3B82F6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: isWeb ? 72 : insets.top + 16 }]}
      >
        {!isEmployer && (
          <TouchableOpacity
            style={styles.shareCardBtn}
            onPress={() => setShowSeekerCard(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="card-outline" size={16} color="#fff" />
            <Text style={styles.shareCardBtnText}>My Card</Text>
          </TouchableOpacity>
        )}

        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {!isEmployer && (
            <View style={[styles.scoreRing, { borderColor: score >= 80 ? "#34D399" : "#FCD34D" }]}>
              <Text style={[styles.scoreRingText, { color: score >= 80 ? "#34D399" : "#FCD34D" }]}>
                {score}%
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.heroName}>{isEmployer && user.companyName ? user.companyName : user.name}</Text>
        
        <View style={styles.heroBadgeRow}>
          <View style={styles.heroBadge}>
            <Ionicons name={isEmployer ? "business" : "briefcase"} size={12} color="#fff" />
            <Text style={styles.heroBadgeText}>{isEmployer ? "Employer" : "Job Seeker"}</Text>
          </View>
          {!isEmployer && user.experience && (
            <View style={styles.heroBadge}>
              <Ionicons name="time-outline" size={12} color="#fff" />
              <Text style={styles.heroBadgeText}>{user.experience}</Text>
            </View>
          )}
        </View>

        {(isEmployer ? user.companyDescription : user.bio) ? (
          <Text style={styles.heroBio} numberOfLines={2}>{isEmployer ? user.companyDescription : user.bio}</Text>
        ) : (
          <TouchableOpacity onPress={() => setShowEditModal(true)}>
            <Text style={styles.heroAddBio}>+ Add a short {isEmployer ? "company description" : "bio"}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.heroPhone}>+91 {user.phone} · {user.location}</Text>



        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => {
            setEditForm({
              name: user.name,
              bio: user.bio,
              location: user.location,
              education: user.education,
              experience: user.experience,
              language: user.language,
              companyName: user.companyName ?? "",
              companyDescription: user.companyDescription ?? "",
            });
            setShowEditModal(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil" size={14} color="#2563EB" />
          <Text style={styles.editProfileBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* ── STATS ROW ── */}
      <View style={styles.statsRow}>
        <StatCard
          value={appliedJobIds.length}
          label="Applied"
          icon="send"
          color="#2563EB"
          bg="#DBEAFE"
        />
        <StatCard
          value={savedJobIds.length}
          label="Saved"
          icon="bookmark"
          color="#7C3AED"
          bg="#EDE9FE"
        />
        {isEmployer ? (
          <StatCard
            value={postedJobs.length}
            label="Posted"
            icon="add-circle"
            color="#059669"
            bg="#D1FAE5"
          />
        ) : (
          <StatCard
            value={score}
            label="Score"
            icon="star"
            color="#D97706"
            bg="#FEF3C7"
            suffix="%"
          />
        )}
      </View>

      {/* ── SEEKER-ONLY SECTIONS ── */}
      {!isEmployer && (
        <>
          {/* Profile Completion */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconWrap, { backgroundColor: "#DBEAFE" }]}>
                  <Ionicons name="checkmark-circle" size={16} color="#2563EB" />
                </View>
                <Text style={styles.cardTitle}>Profile Strength</Text>
              </View>
              <Text style={[styles.scoreLabel, { color: score >= 80 ? "#059669" : score >= 50 ? "#D97706" : "#DC2626" }]}>
                {score >= 80 ? "Strong" : score >= 50 ? "Good" : "Weak"}
              </Text>
            </View>

            <View style={styles.scoreBarBg}>
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    width: `${score}%` as `${number}%`,
                    backgroundColor: score >= 80 ? "#059669" : score >= 50 ? "#D97706" : "#2563EB",
                  },
                ]}
              />
            </View>

            <View style={styles.completionList}>
              {completionItems.map((item) => (
                <View key={item.label} style={styles.completionItem}>
                  <View style={[styles.completionDot, { backgroundColor: item.done ? "#D1FAE5" : "#F1F5F9" }]}>
                    <Ionicons
                      name={item.done ? "checkmark" : "remove"}
                      size={12}
                      color={item.done ? "#059669" : "#94A3B8"}
                    />
                  </View>
                  <Text style={[styles.completionText, { color: item.done ? "#0F172A" : "#94A3B8" }]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Skills */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconWrap, { backgroundColor: "#EDE9FE" }]}>
                  <Ionicons name="code-slash" size={16} color="#7C3AED" />
                </View>
                <Text style={styles.cardTitle}>My Skills</Text>
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowSkillModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color="#2563EB" />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.skillsWrap}>
              {user.skills.map((skill) => (
                <TouchableOpacity
                  key={skill}
                  style={styles.skillChip}
                  onPress={() => handleRemoveSkill(skill)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skillChipText}>{skill}</Text>
                  <Ionicons name="close" size={12} color="#2563EB" />
                </TouchableOpacity>
              ))}
              {user.skills.length === 0 && (
                <TouchableOpacity onPress={() => setShowSkillModal(true)}>
                  <Text style={styles.emptySkillsText}>Tap "+ Add" to add your skills</Text>
                </TouchableOpacity>
              )}
            </View>

            {user.skills.length > 0 && (
              <Text style={styles.skillHint}>Tap a skill to remove it</Text>
            )}
          </View>

          {/* Profile Details */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconWrap, { backgroundColor: "#D1FAE5" }]}>
                  <Ionicons name="person" size={16} color="#059669" />
                </View>
                <Text style={styles.cardTitle}>Profile Details</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setEditForm({
                    name: user.name,
                    bio: user.bio,
                    location: user.location,
                    education: user.education,
                    experience: user.experience,
                    language: user.language,
                    companyName: user.companyName ?? "",
                    companyDescription: user.companyDescription ?? "",
                  });
                  setShowEditModal(true);
                }}
                style={styles.editBtn}
              >
                <Ionicons name="pencil-outline" size={14} color="#2563EB" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <DetailRow icon="location-outline" label="Preferred Location" value={user.location} />
            <DetailRow icon="school-outline" label="Education" value={user.education} />
            <DetailRow icon="briefcase-outline" label="Experience" value={user.experience} />
            <DetailRow icon="language-outline" label="Language" value={user.language} />
            <DetailRow
              icon="document-text-outline"
              label="Bio"
              value={user.bio || "Not added yet"}
              last
            />
          </View>

          {/* Resume */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconWrap, { backgroundColor: user.resumeUploaded ? "#D1FAE5" : "#FEE2E2" }]}>
                  <Ionicons
                    name="document-attach"
                    size={16}
                    color={user.resumeUploaded ? "#059669" : "#DC2626"}
                  />
                </View>
                <Text style={styles.cardTitle}>Resume</Text>
              </View>
            </View>

            {user.resumeUploaded ? (
              <>
                {/* Compact Resume Card */}
                <TouchableOpacity
                  style={styles.resumeCard}
                  onPress={() => setShowResumePreview(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.resumeCardLeft}>
                    <Ionicons name="document" size={20} color="#DC2626" />
                    <Text style={styles.resumeFileName} numberOfLines={1}>
                      {user.resumeName || "resume.pdf"}
                    </Text>
                  </View>
                  <View style={styles.resumeViewBtn}>
                    <Text style={styles.resumeViewBtnText}>View</Text>
                    <Ionicons name="chevron-forward" size={14} color="#2563EB" />
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.resumeDesc}>
                  Upload your resume to stand out from other applicants.
                </Text>

                <TouchableOpacity
                  style={styles.resumeBtn}
                  onPress={handleUploadResume}
                  activeOpacity={0.85}
                >
                  <Ionicons name="cloud-upload-outline" size={17} color="#fff" />
                  <Text style={styles.resumeBtnText}>Upload Resume</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </>
      )}

      {/* ── EMPLOYER SECTIONS ── */}
      {isEmployer && (
        <>
          {/* Employer Dashboard */}
          <View style={styles.dashboardRow}>
            <StatCard
              value={postedJobs.length}
              label="Total Jobs"
              icon="briefcase"
              color="#2563EB"
              bg="#DBEAFE"
            />
            <StatCard
              value={postedJobs.length}
              label="Active"
              icon="checkmark-circle"
              color="#059669"
              bg="#D1FAE5"
            />
            <StatCard
              value={postedJobs.length === 0 ? 0 : 0}
              label="Closed"
              icon="close-circle"
              color="#64748B"
              bg="#F1F5F9"
            />
            <StatCard
              value={postedJobs.reduce((sum, j) => sum + j.applicants, 0)}
              label="Applicants"
              icon="people"
              color="#7C3AED"
              bg="#EDE9FE"
            />
          </View>


          <TouchableOpacity
            style={styles.postJobBtn}
            onPress={() => router.push("/post-job")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#1D4ED8", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.postJobBtnInner}
            >
              <Ionicons name="add-circle" size={22} color="#fff" />
              <Text style={styles.postJobBtnText}>Post a New Job</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconWrap, { backgroundColor: "#DBEAFE" }]}>
                  <Ionicons name="briefcase" size={16} color="#2563EB" />
                </View>
                <Text style={styles.cardTitle}>My Job Listings</Text>
              </View>
              <Text style={styles.listingCount}>{postedJobs.length} active</Text>
            </View>

            {postedJobs.length === 0 ? (
              <View style={styles.emptyPosted}>
                <Ionicons name="briefcase-outline" size={36} color="#CBD5E1" />
                <Text style={styles.emptyPostedText}>No jobs posted yet</Text>
              </View>
            ) : (
              postedJobs.map((job, idx) => (
                <View
                  key={job.id}
                  style={[styles.postedRow, idx < postedJobs.length - 1 && styles.postedRowBorder]}
                >
                  <View style={[styles.postedLogo, { backgroundColor: job.logoColor + "18" }]}>
                    <Text style={[styles.postedLogoText, { color: job.logoColor }]}>{job.logoInitials}</Text>
                  </View>
                  <View style={styles.postedInfo}>
                    <Text style={styles.postedTitle} numberOfLines={1}>{job.title}</Text>
                    <Text style={styles.postedMeta}>{job.location} · {job.salary}</Text>
                    <View style={styles.postedBadges}>
                      {job.isUrgent && (
                        <View style={styles.urgentBadge}>
                          <Text style={styles.urgentText}>Urgent</Text>
                        </View>
                      )}
                      <Text style={styles.postedTime}>{job.postedTime}</Text>
                      <View style={styles.applicantBadge}>
                        <Ionicons name="people" size={12} color="#059669" />
                        <Text style={styles.applicantText}>{job.applicants} applicants</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.postedActions}>
                    <TouchableOpacity
                      onPress={() => handleEditJob(job.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="pencil-outline" size={18} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteJob(job.id, job.title)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}

      {/* ── SETTINGS ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.cardIconWrap, { backgroundColor: "#F1F5F9" }]}>
              <Ionicons name="settings" size={16} color="#475569" />
            </View>
            <Text style={styles.cardTitle}>Settings</Text>
          </View>
        </View>
        
        {!isEmployer && (
          <MenuItem icon="bookmark-outline" label="Saved Jobs" onPress={() => router.push("/(tabs)/saved")} />
        )}
        <MenuItem 
          icon="language-outline" 
          label={`Language (${user.language || 'English'})`} 
          onPress={() => {
            setEditForm({
              name: user.name,
              bio: user.bio,
              location: user.location,
              education: user.education,
              experience: user.experience,
              language: user.language,
              companyName: user.companyName ?? "",
              companyDescription: user.companyDescription ?? "",
            });
            setShowEditModal(true);
          }} 
        />
        <MenuItem icon="notifications-outline" label="Notifications" onPress={() => router.push("/notifications")} />
        <MenuItem icon="help-circle-outline" label="Help & Support" />
        <MenuItem icon="log-out-outline" label="Log Out" onPress={handleLogout} isDestructive last />
      </View>

      {/* ── ADMIN PANEL (hidden access via special phone) ── */}
      {user.isAuthenticated && user.phone.startsWith("000") && (
        <TouchableOpacity
          style={styles.adminPanelBtn}
          onPress={() => router.push("/admin")}
          activeOpacity={0.85}
        >
          <View style={styles.adminPanelIcon}>
            <Ionicons name="shield" size={18} color="#4338CA" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.adminPanelTitle}>Admin Panel</Text>
            <Text style={styles.adminPanelSub}>Manage jobs, verifications & reports</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#4338CA" />
        </TouchableOpacity>
      )}

      {/* ── EDIT PROFILE MODAL ── */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.modalClose}>
              <Ionicons name="close" size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {isEmployer && (
              <>
                <FormField
                  label="Company Name"
                  value={editForm.companyName}
                  onChangeText={(v) => setEditForm((p) => ({ ...p, companyName: v }))}
                  placeholder="Your company name"
                />
                <FormField
                  label="Company Description"
                  value={editForm.companyDescription}
                  onChangeText={(v) => setEditForm((p) => ({ ...p, companyDescription: v }))}
                  placeholder="What does your company do?"
                  multiline
                />
              </>
            )}
            <FormField
              label={isEmployer ? "Contact Person Name" : "Full Name"}
              value={editForm.name}
              onChangeText={(v) => setEditForm((p) => ({ ...p, name: v }))}
              placeholder="Your name"
            />
            {!isEmployer && (
              <FormField
                label="Short Bio"
                value={editForm.bio}
                onChangeText={(v) => setEditForm((p) => ({ ...p, bio: v }))}
                placeholder="e.g. Experienced delivery executive based in Rohini..."
                multiline
              />
            )}

            <Text style={styles.formLabel}>Preferred Location</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
              {LOCALITIES.filter((l) => l !== "All Areas").map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[styles.optionChip, editForm.location === loc && styles.optionChipActive]}
                  onPress={() => setEditForm((p) => ({ ...p, location: loc }))}
                >
                  <Text style={[styles.optionChipText, editForm.location === loc && styles.optionChipTextActive]}>
                    {loc}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {!isEmployer && (
              <>
                <Text style={styles.formLabel}>Education</Text>
                <View style={styles.optionGrid}>
                  {EDUCATION_OPTIONS.map((edu) => (
                    <TouchableOpacity
                      key={edu}
                      style={[styles.optionChip, editForm.education === edu && styles.optionChipActive]}
                      onPress={() => setEditForm((p) => ({ ...p, education: edu }))}
                    >
                      <Text style={[styles.optionChipText, editForm.education === edu && styles.optionChipTextActive]}>
                        {edu}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Experience</Text>
                <View style={styles.optionGrid}>
                  {EXPERIENCE_OPTIONS.map((exp) => (
                    <TouchableOpacity
                      key={exp}
                      style={[styles.optionChip, editForm.experience === exp && styles.optionChipActive]}
                      onPress={() => setEditForm((p) => ({ ...p, experience: exp }))}
                    >
                      <Text style={[styles.optionChipText, editForm.experience === exp && styles.optionChipTextActive]}>
                        {exp}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Language</Text>
                <View style={styles.optionGrid}>
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      style={[styles.optionChip, editForm.language === lang && styles.optionChipActive]}
                      onPress={() => setEditForm((p) => ({ ...p, language: lang }))}
                    >
                      <Text style={[styles.optionChipText, editForm.language === lang && styles.optionChipTextActive]}>
                        {lang}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.saveBtnCancel} onPress={() => setShowEditModal(false)}>
              <Text style={styles.saveBtnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── ADD SKILL MODAL ── */}
      <Modal visible={showSkillModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Skills</Text>
            <TouchableOpacity onPress={() => setShowSkillModal(false)} style={styles.modalClose}>
              <Ionicons name="close" size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.skillInputRow}>
              <TextInput
                style={styles.skillInput}
                value={newSkill}
                onChangeText={setNewSkill}
                placeholder="Type a skill..."
                placeholderTextColor="#94A3B8"
                returnKeyType="done"
                onSubmitEditing={() => { handleAddSkill(newSkill); }}
              />
              <TouchableOpacity
                style={styles.skillAddBtn}
                onPress={() => handleAddSkill(newSkill)}
                activeOpacity={0.85}
              >
                <Text style={styles.skillAddBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.suggestedTitle}>Popular Skills</Text>
            <View style={styles.optionGrid}>
              {SUGGESTED_SKILLS.filter((s) => !user.skills.includes(s)).map((skill) => (
                <TouchableOpacity
                  key={skill}
                  style={styles.suggestedChip}
                  onPress={() => handleAddSkill(skill)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={13} color="#2563EB" />
                  <Text style={styles.suggestedChipText}>{skill}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {user.skills.length > 0 && (
              <>
                <Text style={styles.suggestedTitle}>My Skills</Text>
                <View style={styles.optionGrid}>
                  {user.skills.map((skill) => (
                    <TouchableOpacity
                      key={skill}
                      style={[styles.optionChip, styles.optionChipActive]}
                      onPress={() => handleRemoveSkill(skill)}
                    >
                      <Text style={styles.optionChipTextActive}>{skill}</Text>
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.saveBtn} onPress={() => setShowSkillModal(false)} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── JOB SEEKER CARD MODAL ── */}
      <Modal visible={showSeekerCard} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>My Job Seeker Card</Text>
            <TouchableOpacity onPress={() => setShowSeekerCard(false)} style={styles.modalClose}>
              <Ionicons name="close" size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={{ alignItems: "center", paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.cardSubtitle}>Share this card with employers</Text>

            {/* The Card */}
            <View style={styles.seekerCard}>
              <LinearGradient
                colors={["#1D4ED8", "#2563EB", "#60A5FA"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.seekerCardHeader}
              >
                <View style={styles.seekerCardAvatar}>
                  <Text style={styles.seekerCardAvatarText}>{initials}</Text>
                </View>
                <View style={styles.seekerCardInfo}>
                  <Text style={styles.seekerCardName}>{user.name}</Text>
                  <Text style={styles.seekerCardRole}>Job Seeker · {user.experience}</Text>
                  <Text style={styles.seekerCardLocation}>📍 {user.location}</Text>
                </View>
                <View style={styles.seekerCardLogo}>
                  <Text style={styles.seekerCardLogoText}>R</Text>
                  <Text style={styles.seekerCardLogoSub}>Rozgaar{"\n"}Setu</Text>
                </View>
              </LinearGradient>

              <View style={styles.seekerCardBody}>
                <View style={styles.seekerCardRow}>
                  <View style={styles.seekerCardLeft}>
                    <Text style={styles.seekerCardSectionTitle}>Education</Text>
                    <Text style={styles.seekerCardSectionValue}>{user.education}</Text>

                    <Text style={[styles.seekerCardSectionTitle, { marginTop: 12 }]}>Contact</Text>
                    <View style={styles.seekerContactRow}>
                      <MaterialCommunityIcons name="whatsapp" size={14} color="#25D366" />
                      <Text style={styles.seekerCardSectionValue}>+91 {user.phone}</Text>
                    </View>

                    {user.skills.length > 0 && (
                      <>
                        <Text style={[styles.seekerCardSectionTitle, { marginTop: 12 }]}>Top Skills</Text>
                        <View style={styles.seekerSkillsWrap}>
                          {user.skills.slice(0, 4).map((s) => (
                            <View key={s} style={styles.seekerSkillChip}>
                              <Text style={styles.seekerSkillText}>{s}</Text>
                            </View>
                          ))}
                        </View>
                      </>
                    )}
                  </View>

                  <View style={styles.seekerCardQR}>
                    <Image
                      source={{ uri: qrUrl }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.qrLabel}>Scan to contact</Text>
                  </View>
                </View>

                <View style={styles.seekerCardFooter}>
                  <Text style={styles.seekerCardFooterText}>Powered by RozgaarSetu · North Delhi's #1 Job Platform</Text>
                </View>
              </View>
            </View>

            {/* Share Button */}
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareCard} activeOpacity={0.85}>
              <Ionicons name="share-social" size={20} color="#fff" />
              <Text style={styles.shareBtnText}>Share My Card</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsappShareBtn}
              onPress={() => {
                const msg = encodeURIComponent(
                  `Hi! I'm ${user.name}, looking for jobs in ${user.location}. Skills: ${user.skills.join(", ") || "—"}. Contact: +91${user.phone}. (via RozgaarSetu)`
                );
                const { Linking } = require("react-native");
                Linking.openURL(`https://wa.me/?text=${msg}`);
              }}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
              <Text style={styles.whatsappShareText}>Share via WhatsApp</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── RESUME PREVIEW MODAL ── */}
      <Modal visible={showResumePreview} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Resume Preview</Text>
            <TouchableOpacity onPress={() => setShowResumePreview(false)} style={styles.modalClose}>
              <Ionicons name="close" size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.resumePreviewScroll} showsVerticalScrollIndicator={false}>
            {/* PDF Preview Box */}
            <View style={styles.resumePreviewBox}>
              <Ionicons name="document" size={64} color="#DC2626" />
              <Text style={styles.resumePreviewFileName}>{user.resumeName || "resume.pdf"}</Text>
              <Text style={styles.resumePreviewHint}>PDF document</Text>
              <TouchableOpacity
                style={styles.openPdfBtn}
                onPress={async () => {
                  try {
                    const url = await openResume();
                    const { Linking } = require("react-native");
                    Linking.openURL(url);
                  } catch {
                    Alert.alert("Error", "Resume not available");
                  }
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="open-outline" size={16} color="#2563EB" />
                <Text style={styles.openPdfBtnText}>Open PDF</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={styles.resumePreviewFooter}>
            <TouchableOpacity
              style={styles.deleteResumeBtn}
              onPress={handleDeleteResume}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.deleteResumeBtnText}>Delete Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.uploadNewResumeBtn}
              onPress={handleUploadResume}
              activeOpacity={0.85}
            >
              <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
              <Text style={styles.uploadNewResumeBtnText}>Upload New</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* ── SUB COMPONENTS ── */

function GuestView({ onSignIn, insets, isWeb }: { onSignIn: () => void; insets: { top: number }; isWeb: boolean }) {
  return (
    <View style={[guestStyles.container, { paddingTop: isWeb ? 67 : insets.top }]}>
      <LinearGradient colors={["#1D4ED8", "#2563EB", "#3B82F6"]} style={guestStyles.top}>
        <View style={guestStyles.avatar}>
          <Ionicons name="person" size={44} color="#fff" />
        </View>
      </LinearGradient>
      <View style={guestStyles.body}>
        <Text style={guestStyles.title}>Create Your Profile</Text>
        <Text style={guestStyles.sub}>Get matched with local jobs based on your skills and experience</Text>
        <View style={guestStyles.perks}>
          {["Track applied jobs", "Save favourites", "Get a shareable Job Card", "Build your profile"].map((p) => (
            <View key={p} style={guestStyles.perkRow}>
              <Ionicons name="checkmark-circle" size={18} color="#2563EB" />
              <Text style={guestStyles.perkText}>{p}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={guestStyles.btn} onPress={onSignIn} activeOpacity={0.85}>
          <Text style={guestStyles.btnText}>Sign In / Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const guestStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2FF" },
  top: { alignItems: "center", paddingVertical: 40 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "rgba(255,255,255,0.4)" },
  body: { flex: 1, padding: 24, alignItems: "center" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#0F172A", marginTop: 8, marginBottom: 8 },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#64748B", textAlign: "center", marginBottom: 24 },
  perks: { alignSelf: "stretch", gap: 10, marginBottom: 32 },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  perkText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#0F172A" },
  btn: { backgroundColor: "#2563EB", paddingHorizontal: 40, paddingVertical: 16, borderRadius: 18, shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});

function StatCard({ value, label, icon, color, bg, suffix = "" }: {
  value: number; label: string; icon: string; color: string; bg: string; suffix?: string;
}) {
  return (
    <View style={[statStyles.card, { backgroundColor: "#fff" }]}>
      <View style={[statStyles.iconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon as "star"} size={20} color={color} />
      </View>
      <Text style={statStyles.value}>{value}{suffix}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 20, gap: 6, shadowColor: "#3B5BDB", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  value: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#0F172A" },
  label: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#64748B" },
});

function DetailRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <View style={[detailStyles.row, !last && detailStyles.rowBorder]}>
      <View style={detailStyles.iconWrap}>
        <Ionicons name={icon as "location-outline"} size={16} color="#2563EB" />
      </View>
      <View style={detailStyles.text}>
        <Text style={detailStyles.label}>{label}</Text>
        <Text style={detailStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  iconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", marginTop: 1 },
  text: { flex: 1 },
  label: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#94A3B8", marginBottom: 2 },
  value: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#0F172A" },
});

function MenuItem({ icon, label, last, onPress, isDestructive }: { icon: string; label: string; last?: boolean; onPress?: () => void; isDestructive?: boolean }) {
  return (
    <TouchableOpacity style={[menuStyles.row, !last && menuStyles.rowBorder]} activeOpacity={0.7} onPress={onPress}>
      <View style={[menuStyles.iconWrap, isDestructive && { backgroundColor: "#FFF5F5" }]}>
        <Ionicons name={icon as "settings-outline"} size={17} color={isDestructive ? "#EF4444" : "#64748B"} />
      </View>
      <Text style={[menuStyles.label, isDestructive && { color: "#EF4444" }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
    </TouchableOpacity>
  );
}

const menuStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  iconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#F8FAFF", alignItems: "center", justifyContent: "center" },
  label: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: "#0F172A" },
});

function FormField({ label, value, onChangeText, placeholder, multiline }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; multiline?: boolean;
}) {
  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      <TextInput
        style={[formStyles.input, multiline && formStyles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

const formStyles = StyleSheet.create({
  field: { marginBottom: 18 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#0F172A", marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", color: "#0F172A", backgroundColor: "#F8FAFF" },
  inputMulti: { height: 80, textAlignVertical: "top" },
});

/* ── MAIN STYLES ── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2FF" },
  scroll: { paddingHorizontal: 0 },

  /* Hero */
  hero: { paddingHorizontal: 20, paddingBottom: 28, alignItems: "center", marginBottom: 16, position: "relative" },
  shareCardBtn: { position: "absolute", top: 16, right: 16, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  shareCardBtnText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  avatarWrap: { position: "relative", marginBottom: 14, marginTop: 8 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "rgba(255,255,255,0.5)" },
  avatarText: { fontSize: 30, fontFamily: "Inter_700Bold", color: "#fff" },
  scoreRing: { position: "absolute", bottom: -4, right: -8, borderWidth: 2.5, borderRadius: 16, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: "#1E3A8A" },
  scoreRingText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  heroName: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 6 },
  heroBio: { fontSize: 13, color: "rgba(255,255,255,0.85)", fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 6, paddingHorizontal: 20 },
  heroAddBio: { fontSize: 13, color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular", marginBottom: 6 },
  heroPhone: { fontSize: 12, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", marginBottom: 12 },
  heroBadgeRow: { flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 14, flexWrap: "wrap", justifyContent: "center" },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  heroBadgeText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  editProfileBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20 },
  editProfileBtnText: { color: "#2563EB", fontSize: 13, fontFamily: "Inter_600SemiBold" },

  /* Stats */
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14, paddingHorizontal: 16 },
  dashboardRow: { flexDirection: "row", gap: 10, marginBottom: 14, marginTop: 10, paddingHorizontal: 16 },

  /* Card */
  card: { backgroundColor: "#fff", borderRadius: 22, padding: 16, marginBottom: 14, marginHorizontal: 16, shadowColor: "#3B5BDB", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#0F172A" },

  /* Completion */
  scoreLabel: { fontSize: 12, fontFamily: "Inter_700Bold" },
  scoreBarBg: { height: 8, borderRadius: 4, backgroundColor: "#EEF2FF", overflow: "hidden", marginBottom: 14 },
  scoreBarFill: { height: "100%", borderRadius: 4 },
  completionList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  completionItem: { flexDirection: "row", alignItems: "center", gap: 6, width: "48%" },
  completionDot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  completionText: { fontSize: 12, fontFamily: "Inter_500Medium" },

  /* Skills */
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EEF2FF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#2563EB" },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#EEF2FF", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#BFDBFE" },
  skillChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#1D4ED8" },
  skillHint: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#94A3B8", marginTop: 8 },
  emptySkillsText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#94A3B8", paddingVertical: 8 },

  /* Detail edit */
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EEF2FF", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  editBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#2563EB" },

  /* Resume */
  resumeStatusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  resumeDot: { width: 6, height: 6, borderRadius: 3 },
  resumeStatusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  resumeDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#64748B", marginBottom: 14, lineHeight: 20 },
  resumeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 14, backgroundColor: "#2563EB" },
  resumeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  
  /* Resume Card */
  resumeCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F8FAFF", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 0 },
  resumeCardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  resumeFileName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#0F172A", flex: 1 },
  resumeViewBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EEF2FF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  resumeViewBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#2563EB" },

  /* Resume Preview */
  resumePreviewScroll: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  resumePreviewBox: { alignItems: "center", paddingVertical: 40, backgroundColor: "#F8FAFF", borderRadius: 18, borderWidth: 1, borderColor: "#E2E8F0", gap: 12 },
  resumePreviewFileName: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#0F172A", textAlign: "center" },
  resumePreviewHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#94A3B8" },
  openPdfBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#DBEAFE", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginTop: 8 },
  openPdfBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#2563EB" },
  resumePreviewFooter: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  deleteResumeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FFF5F5", paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: "#FECACA" },
  deleteResumeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#EF4444" },
  uploadNewResumeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#2563EB", paddingVertical: 13, borderRadius: 14 },
  uploadNewResumeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },

  /* Employer */
  postJobBtn: { marginHorizontal: 16, marginBottom: 14, borderRadius: 18, overflow: "hidden", shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  postJobBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17 },
  postJobBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  listingCount: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#64748B" },
  emptyPosted: { alignItems: "center", paddingVertical: 28, gap: 8 },
  emptyPostedText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#94A3B8" },
  postedRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  postedRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  postedLogo: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  postedLogoText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  postedInfo: { flex: 1 },
  postedTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#0F172A", marginBottom: 2 },
  postedMeta: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#64748B", marginBottom: 4 },
  postedBadges: { flexDirection: "row", alignItems: "center", gap: 8 },
  urgentBadge: { backgroundColor: "#FEE2E2", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  urgentText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#DC2626" },
  applicantBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: "#DCFCE7" },
  applicantText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#059669" },
  postedTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#94A3B8" },
  postedActions: { flexDirection: "row", alignItems: "center", gap: 12 },

  /* Settings / Logout */
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: "#FECACA", backgroundColor: "#FFF5F5", marginHorizontal: 16, marginBottom: 10 },
  logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#EF4444" },

  /* Modals */
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#0F172A" },
  modalClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  modalScroll: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  modalFooter: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  formLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#0F172A", marginBottom: 10, marginTop: 4 },
  optionScroll: { marginBottom: 18 },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0" },
  optionChipActive: { backgroundColor: "#2563EB", borderColor: "#2563EB", flexDirection: "row", alignItems: "center", gap: 5 },
  optionChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#475569" },
  optionChipTextActive: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  saveBtn: { flex: 1, backgroundColor: "#2563EB", paddingVertical: 14, borderRadius: 16, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  saveBtnCancel: { flex: 0.5, paddingVertical: 14, borderRadius: 16, alignItems: "center", backgroundColor: "#F1F5F9" },
  saveBtnCancelText: { color: "#475569", fontSize: 15, fontFamily: "Inter_600SemiBold" },

  /* Skill modal */
  skillInputRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  skillInput: { flex: 1, borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", color: "#0F172A", backgroundColor: "#F8FAFF" },
  skillAddBtn: { backgroundColor: "#2563EB", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, justifyContent: "center" },
  skillAddBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  suggestedTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#0F172A", marginBottom: 10 },
  suggestedChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: "#EEF2FF", borderWidth: 1, borderColor: "#BFDBFE" },
  suggestedChipText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#1D4ED8" },

  /* Seeker Card */
  cardSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#64748B", marginBottom: 20, textAlign: "center" },
  seekerCard: { width: "100%", borderRadius: 24, overflow: "hidden", shadowColor: "#1D4ED8", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 8, marginBottom: 20 },
  seekerCardHeader: { flexDirection: "row", alignItems: "center", padding: 18, gap: 14 },
  seekerCardAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  seekerCardAvatarText: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  seekerCardInfo: { flex: 1 },
  seekerCardName: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  seekerCardRole: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontFamily: "Inter_400Regular" },
  seekerCardLocation: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontFamily: "Inter_400Regular", marginTop: 2 },
  seekerCardLogo: { alignItems: "center" },
  seekerCardLogoText: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", backgroundColor: "rgba(255,255,255,0.2)", width: 36, height: 36, borderRadius: 10, textAlign: "center", lineHeight: 36 },
  seekerCardLogoSub: { fontSize: 9, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_500Medium", textAlign: "center", marginTop: 3 },
  seekerCardBody: { backgroundColor: "#fff", padding: 16 },
  seekerCardRow: { flexDirection: "row", gap: 16 },
  seekerCardLeft: { flex: 1 },
  seekerCardSectionTitle: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#94A3B8", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 },
  seekerCardSectionValue: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#0F172A" },
  seekerContactRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  seekerSkillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  seekerSkillChip: { backgroundColor: "#EEF2FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  seekerSkillText: { fontSize: 10, fontFamily: "Inter_500Medium", color: "#2563EB" },
  seekerCardQR: { alignItems: "center", gap: 6 },
  qrImage: { width: 110, height: 110, borderRadius: 10, backgroundColor: "#EEF2FF" },
  qrLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#94A3B8" },
  seekerCardFooter: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9", alignItems: "center" },
  seekerCardFooterText: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#94A3B8", textAlign: "center" },

  shareBtn: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#2563EB", paddingVertical: 15, borderRadius: 16, marginBottom: 12, shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5 },
  shareBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  whatsappShareBtn: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#F0FDF4", paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: "#BBF7D0" },
  whatsappShareText: { color: "#16A34A", fontSize: 14, fontFamily: "Inter_600SemiBold" },

  adminPanelBtn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#EEF2FF", borderRadius: 18, padding: 14, marginHorizontal: 16, marginBottom: 14, borderWidth: 1, borderColor: "#C7D2FE" },
  adminPanelIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#E0E7FF", alignItems: "center", justifyContent: "center" },
  adminPanelTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#3730A3" },
  adminPanelSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#6366F1", marginTop: 1 },
});
