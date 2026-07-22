import { useState, useEffect, useRef } from "react";
import { cancelAllNativeAlarms, cancelNativeAlarm, canUseExactNativeAlarms, canUseFullScreenNativeAlarms, openExactAlarmSettings, openFullScreenAlarmSettings, playAlarmTone, scheduleInAppReminders, scheduleNativeAlarms } from "./lib/alarms.js";
import * as React from "react";
import { adminImportWorkspace, assignCloudProgram, coachCreateClient, createAuditLog, createCloudAppointment, createCloudBodyMetric, createCloudCoachCode, createCloudNotification, createCloudProgram, createCloudTaskLog, deleteCloudProgram, isDemoAccountsEnabled, isProductionMode, loadProductionWorkspace, productionReadiness, registerAccount, registerCloudDeviceToken, saveProfilePatch, supabaseRest, updateCloudAppointment, updateCloudProgram, upsertCloudDailyTaskStatus } from "./lib/production.js";
import { clearSession, saveSession } from "./lib/session.js";
import { DEMO_ACCOUNTS } from "./lib/demoAccounts.js";
import {
  authenticateUser,
  buildLocalClientRegistration,
  buildLocalCoachRegistration,
  registrationPayload,
  validateRegistration,
  validateRegistrationBase,
  withPassword,
} from "./features/auth/authService.js";
import { restoreStoredUser } from "./features/auth/sessionService.js";
import {
  applySessionPatch,
  buildClientSessionRequest,
  buildCoachSession,
  clientSessionConfirmedNotice,
  clientSessionRequestNotice,
  coachCreatedSessionNotice,
  coachSessionNotice,
  sessionsForClient,
  sessionsForCoach,
  sessionsForDate,
  todayIsoDate,
  weekDateItems,
} from "./features/calendar/appointmentService.js";
import { attachClientToCoach, buildNewClientProfile } from "./features/clients/clientService.js";
import { dashboardWeightText, getClientDashboardSummary, getCoachDashboardSummary } from "./features/dashboard/dashboardSelectors.js";
import { applyBodyEstimateToDraft, bodyDefaults, normalizeBody } from "./features/measurements/measurementService.js";
import { conversationBetween, createMediaMessageDraft, createMessageRecord, messagePreviewText, roomMessages, syncConversationRead } from "./features/messages/messageService.js";
import { MediaAudio, MediaImage, ProductVideo, hasMediaImage } from "./features/media/mediaComponents.jsx";
import { MediaStore, persistMedia } from "./features/media/mediaService.js";
import { applyCoachProofStatus, createProofReviewLog, getCoachProofActions } from "./features/photos/proofService.js";
import { resolveProfilePatch } from "./features/profile/profileService.js";
import {
  averageCompliance,
  clientProgressBars,
  clientProgressBody,
  clientsByCompliance,
  clientsByMonthlyScore,
  coachReportClients,
  recentTaskLogsForClients,
  reportTrendBars,
  riskClients,
  topClientProgressClients,
  totalLostWeight,
} from "./features/reports/reportSelectors.js";
import {
  allPrograms as selectAllPrograms,
  buildAssignedProgramClient,
  clientHasStarted as selectClientHasStarted,
  clientStartAt as selectClientStartAt,
  displayProgram as selectDisplayProgram,
  getTemplateByClient as selectTemplateByClient,
  hasAssignedProgram,
  isRiskClient as selectRiskClient,
  isTaskActiveToday as selectTaskActiveToday,
  normalizeProgramTasksForCycle,
  programById as selectProgramById,
  programVideoForAssignment as selectProgramVideoForAssignment,
  proofTaskPlan as selectProofTaskPlan,
  taskTitles as selectTaskTitles,
  templateTasks as selectTemplateTasks,
  uniquePrograms,
  videoActive as selectVideoActive,
} from "./features/programs/programService.js";
import {
  activeCoachNotes as selectActiveCoachNotes,
  addNoticeToUsers,
  applyDismissCoachNote,
  createLocalNotice,
  markMessagesRead as markMessagesReadState,
  showBrowserNotification,
  unreadCount as selectUnreadCount,
  unreadCountFrom as selectUnreadCountFrom,
  unreadMessagesFor as selectUnreadMessagesFor,
} from "./features/notifications/notificationService.js";
import { mergeCloudUsersWithLocal, mergeMessages, normalizeUserDefaults, normalizeUsers } from "./features/sync/workspaceService.js";
import { isTaskOverdue, reminderPermissionWarnings } from "./features/tasks/taskAlarmService.js";
import { dailyStateFor, mergeDailyUser } from "./features/tasks/dailyTaskService.js";
import { buildWeightUpdate } from "./features/weight/weightService.js";
import { daysBetween, ini, maskName, monthlyBadge, rankIcon, weightDelta } from "./shared/lib/format.js";
import { estimateBody, measuresOf } from "./shared/lib/wellness.js";
import { C, F } from "./shared/theme/tokens.js";
import { Card, Ico, Pill, buttonStyle, controlStyle, inputShellStyle } from "./shared/ui/primitives.jsx";

const isCloudId = (value = "") => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const BANNED_FOODS = ["Sucuk", "Salam", "Pilav", "Makarna", "Beyaz ekmek", "Kızartma", "Hamur işi", "Pişmiş havuç", "Paketli gıda", "Patates", "Şekerli gıdalar", "Nescafe", "Mısır"];

const PROGRAM_TEMPLATES = [
  {
    id:"six-foundation", name:"Maxi 6 Temel", desc:"3 gün atomlu, 2 gün atomsuz sabah kahvaltı akışı; shake, ara öğün, dengeli öğle ve erken akşam yemeği takibi", duration:"30 gün", variantNote:"Maxi takip", bannedFoods:BANNED_FOODS,
    quickRules:["Sabah kalk, wc git, tartıl ve tartı fotoğrafını yükle", "07:00-10:00 arasındaki 3 içecek kahvaltıdır ve en geç 10:00'da bitmelidir", "Atomlu karışım 3 gün, atomsuz karışım 2 gün uygulanır", "Her görevde kamera kanıtı zorunludur"],
    cautionNotes:["Öğle yemeğinde protein, karbonhidrat ve lif dengesi kurulmalı; yeşillik tercih değil, her öğünde zorunludur", "Akşam yemeği en geç 19:00'da bitmiş olmalıdır", "Maden suyunun sodyum değeri 100'ün altında olmalı ve ara öğünde içilmelidir", "Günlük sodyum ihtiyacını aşmamak için ürün etiketleri kontrol edilmelidir"],
    tasks:[
      {title:"Sabah tartısı ve fotoğraf", type:"photo_check", section:"Ölçüm", scheduledTime:"07:00", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Fotoğraf Ekle", photoRequired:true, snoozeEnabled:false, snoozeOptions:[], note:"Sabah kalk, wc git, tartıl. Tartının fotoğrafını gruba/koça gönder."},
      {title:"Atomlu kahvaltı karışımı", type:"supplement", section:"Kahvaltı", scheduledTime:"07:15", repeatType:"cycle", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"İçtim", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30,60], cycleLength:5, cycleDays:[0,1,2], note:"3 gün atomlu: 500 ml suya 4 kapak Aloe Vera, 2 tatlı kaşığı Multifiber, 2 çay kaşığı Herbalife çay, 2 tatlı kaşığı Heartwell, 1 tatlı kaşığı Niteworks ekle. Çalkala ve iç."},
      {title:"Atomsuz kahvaltı karışımı", type:"supplement", section:"Kahvaltı", scheduledTime:"07:15", repeatType:"cycle", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"İçtim", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30,60], cycleLength:5, cycleDays:[3,4], note:"2 gün atomsuz: 500 ml suya 2 tatlı kaşığı Multifiber, 2 çay kaşığı Herbalife çay ve 4 kapak Aloe Vera ekle. Çalkala ve iç."},
      {title:"Kahvaltı shake", type:"supplement", section:"Kahvaltı", scheduledTime:"07:45", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"İçtim", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30], note:"400 ml suya 2 tepeleme çorba kaşığı shake koy. İyice çalkala ve iç. Bu üç içecek kahvaltındır; en geç 10:00'da bitmiş olmalı."},
      {title:"Ara öğün: çay ve meyve", type:"meal", section:"Ara Öğün", scheduledTime:"11:00", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Fotoğraf Ekle", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30], note:"11:00-11:30: 500 ml suya 2 çay kaşığı Herbalife çay. Sıcak veya soğuk demleyebilirsin. Yanına 1 porsiyon taze/kuru meyve tüketebilirsin; örnek tarçınlı yeşil elma."},
      {title:"Öğle yemeği", type:"meal", section:"Ana Öğün", scheduledTime:"12:30", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Öğünü Kaydet", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30,60], note:"12:30-14:00: protein, karbonhidrat ve lif dengeli olmalı. Protein: tavuk, et, balık, kurubaklagil, yumurta veya kahvaltı tabağı. Karbonhidrat: 1 dilim çavdar/tam buğday ekmeği, bulgur pilavı veya çorba. Lif: bol yeşillik mutlaka olmalı."},
      {title:"Ara öğün: çay ve çiğ kuruyemiş", type:"meal", section:"Ara Öğün", scheduledTime:"16:00", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Fotoğraf Ekle", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30], note:"16:00-16:30: 500 ml suya 2 çay kaşığı Herbalife çay. Yanına çiğ kuruyemiş; badem, fındık, kabak çekirdeği gibi."},
      {title:"Akşam yemeği", type:"meal", section:"Ana Öğün", scheduledTime:"17:30", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Öğünü Kaydet", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30,60], note:"17:30-19:00: sebze yemeği ve bol salata. Akşam yemeği faslı en geç 19:00'da bitmiş olmalı."}
    ]
  },
  {
    id:"six-basic", name:"6 Temel Program", desc:"3 gün atomlu, 2 gün atomsuz temel kahvaltı karışımı; shake, çaylı ara öğünler, dengeli öğle ve erken akşam yemeği", duration:"30 gün", variantNote:"Temel takip", bannedFoods:BANNED_FOODS,
    quickRules:["Sabah kalk, wc git, tartıl ve tartı fotoğrafını yükle", "07:00-10:00 arasındaki 3 içecek kahvaltıdır ve en geç 10:00'da bitmelidir", "Atomlu karışım 3 gün, atomsuz karışım 2 gün uygulanır", "Her görevde kamera kanıtı zorunludur"],
    cautionNotes:["Öğle yemeğinde protein, karbonhidrat ve lif dengesi kurulmalı; yeşillik tercih değil, her öğünde zorunludur", "Akşam yemeği en geç 19:00'da bitmiş olmalıdır", "Maden suyunun sodyum değeri 100'ün altında olmalı ve ara öğünde içilmelidir", "Günlük sodyum ihtiyacını aşmamak için ürün etiketleri kontrol edilmelidir"],
    tasks:[
      {title:"Sabah tartısı ve fotoğraf", type:"photo_check", section:"Ölçüm", scheduledTime:"07:00", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Fotoğraf Ekle", photoRequired:true, snoozeEnabled:false, snoozeOptions:[], note:"Sabah kalk, wc git, tartıl. Tartının fotoğrafını gruba/koça gönder."},
      {title:"Atomlu kahvaltı karışımı", type:"supplement", section:"Kahvaltı", scheduledTime:"07:15", repeatType:"cycle", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"İçtim", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30,60], cycleLength:5, cycleDays:[0,1,2], note:"3 gün atomlu: 500 ml suya 4 kapak Aloe Vera, 2 tatlı kaşığı Multifiber, 2 tatlı kaşığı Heartwell, 1 tatlı kaşığı Niteworks ekle. Çalkala ve iç."},
      {title:"Atomsuz kahvaltı karışımı", type:"supplement", section:"Kahvaltı", scheduledTime:"07:15", repeatType:"cycle", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"İçtim", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30,60], cycleLength:5, cycleDays:[3,4], note:"2 gün atomsuz: 500 ml suya 2 tatlı kaşığı Multifiber ve 4 kapak Aloe Vera ekle. Çalkala ve iç."},
      {title:"Kahvaltı shake", type:"supplement", section:"Kahvaltı", scheduledTime:"07:45", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"İçtim", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30], note:"400 ml suya 2 tepeleme çorba kaşığı shake koy. İyice çalkala ve iç. Bu üç içecek kahvaltındır; en geç 10:00'da bitmiş olmalı."},
      {title:"Ara öğün: çay ve meyve", type:"meal", section:"Ara Öğün", scheduledTime:"11:00", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Fotoğraf Ekle", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30], note:"11:00-11:30: 500 ml suya 2 çay kaşığı Herbalife çay. Sıcak veya soğuk demleyebilirsin. Yanına 1 porsiyon taze/kuru meyve tüketebilirsin; örnek tarçınlı yeşil elma."},
      {title:"Öğle yemeği", type:"meal", section:"Ana Öğün", scheduledTime:"12:30", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Öğünü Kaydet", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30,60], note:"12:30-14:00: protein, karbonhidrat ve lif dengeli olmalı. Protein: tavuk, et, balık, kurubaklagil, yumurta veya kahvaltı tabağı. Karbonhidrat: 1 dilim çavdar/tam buğday ekmeği, bulgur pilavı veya çorba. Lif: bol yeşillik mutlaka olmalı."},
      {title:"Ara öğün: çay ve çiğ kuruyemiş", type:"meal", section:"Ara Öğün", scheduledTime:"16:00", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Fotoğraf Ekle", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30], note:"16:00-16:30: 500 ml suya 2 çay kaşığı Herbalife çay. Yanına çiğ kuruyemiş; badem, fındık, kabak çekirdeği gibi."},
      {title:"Akşam yemeği", type:"meal", section:"Ana Öğün", scheduledTime:"17:30", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Öğünü Kaydet", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30,60], note:"17:30-19:00: sebze yemeği ve bol salata. Akşam yemeği faslı en geç 19:00'da bitmiş olmalı."}
    ]
  },
  {
    id:"four-foundation", name:"4 Temel Program", desc:"Sabah Multifiber + Aloe Vera karışımı, shake, çaylı ara öğünler, dengeli öğle ve erken akşam yemeği", duration:"30 gün", variantNote:"Sade temel takip", bannedFoods:BANNED_FOODS,
    quickRules:["Sabah kalk, wc git, tartıl ve tartı fotoğrafını yükle", "07:00-10:00 arasındaki kahvaltı karışımı ve shake en geç 10:00'da bitmelidir", "Her görevde kamera kanıtı zorunludur", "Akşam yemeği en geç 19:00'da bitmiş olmalıdır"], cautionNotes:["Öğle yemeğinde protein, karbonhidrat ve lif dengesi kurulmalı; yeşillik tercih değil, her öğünde zorunludur", "Yarım çiğ havuç serbesttir; pişmiş havuç tüketilmez", "Maden suyunun sodyum değeri 100'ün altında olmalı ve ara öğünde içilmelidir", "Günlük sodyum ihtiyacını aşmamak için ürün etiketleri kontrol edilmelidir"],
    tasks:[
      {title:"Sabah tartısı ve fotoğraf", type:"photo_check", section:"Ölçüm", scheduledTime:"07:00", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Fotoğraf Ekle", photoRequired:true, snoozeEnabled:false, snoozeOptions:[], note:"Sabah kalk, wc git, tartıl. Tartının fotoğrafını gruba/koça gönder."},
      {title:"Sabah kahvaltı karışımı", type:"supplement", section:"Kahvaltı", scheduledTime:"07:15", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"İçtim", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30], note:"07:00-10:00 kahvaltı: 500 ml suya 2 tatlı kaşığı Multifiber ve 4 kapak Aloe Vera ekle. Çalkala ve iç."},
      {title:"Kahvaltı shake", type:"supplement", section:"Kahvaltı", scheduledTime:"07:45", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"İçtim", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30], note:"400 ml suya 2 tepeleme çorba kaşığı shake koy. İyice çalkala ve iç. Bu içecekler sabah kahvaltındır; en geç 10:00'da bitmiş olmalı."},
      {title:"Ara öğün: çay ve meyve", type:"meal", section:"Ara Öğün", scheduledTime:"11:00", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Fotoğraf Ekle", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30], note:"11:00-11:30: 500 ml suya 2 çay kaşığı Herbalife çay. Sıcak veya soğuk demleyebilirsin. Yanına 1 porsiyon taze/kuru meyve tüketebilirsin; örnek tarçınlı yeşil elma."},
      {title:"Öğle yemeği", type:"meal", section:"Ana Öğün", scheduledTime:"12:30", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Öğünü Kaydet", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30,60], note:"12:30-14:00: protein, karbonhidrat ve lif dengeli olmalı. Protein: tavuk, et, balık, kurubaklagil, yumurta veya kahvaltı tabağı. Karbonhidrat: 1 dilim çavdar/tam buğday ekmeği, bulgur pilavı veya çorba. Lif: bol yeşillik mutlaka olmalı."},
      {title:"Ara öğün: çay ve çiğ kuruyemiş", type:"meal", section:"Ara Öğün", scheduledTime:"16:00", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Fotoğraf Ekle", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30], note:"16:00-16:30: 500 ml suya 2 çay kaşığı Herbalife çay. Yanına çiğ kuruyemiş; badem, fındık, kabak çekirdeği gibi."},
      {title:"Akşam yemeği", type:"meal", section:"Ana Öğün", scheduledTime:"17:30", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Öğünü Kaydet", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30,60], note:"17:30-19:00: sebze yemeği ve bol salata. Akşam yemeği faslı en geç 19:00'da bitmiş olmalı."}
    ]
  },
  {
    id:"balanced-nutrition", name:"Beslenme Programı", desc:"Sabah tartı kontrolü, 3 gün atomlu / 2 gün atomsuz döngüsü, iki ara öğün ve dengeli öğün rutini", duration:"30 gün", variantNote:"Beslenme odaklı", bannedFoods:BANNED_FOODS, quickRules:["Sabah rutini: uyan, tuvalete git, tartıl ve tartı fotoğrafını yükle", "Kahvaltı en geç 10:00'da tamamlanır", "Akşam yemeği en geç 19:00'da bitmiş olmalıdır"], cautionNotes:["Bulgur ve tam buğday ürünleri genel pilav/makarna kısıtının istisnasıdır", "Maden suyunun sodyum değeri 100'ün altında olmalıdır"],
    tasks:[
      {title:"Sabah tartısı ve fotoğraf", type:"photo_check", section:"Ölçüm", scheduledTime:"07:00", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Fotoğraf Ekle", photoRequired:true, snoozeEnabled:false, snoozeOptions:[], note:"Uyan, tuvalete git, tartıl ve tartı fotoğrafını yükle"},
      {title:"Atomlu içecek", type:"supplement", section:"Ürün", scheduledTime:"07:15", repeatType:"cycle", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"İçtim", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30], cycleLength:5, cycleDays:[0,1,2], note:"500 ml suya Aloe Vera, Multifiber, Herbalife çay, Heartwell ve Niteworks ekle"},
      {title:"Atomsuz içecek", type:"supplement", section:"Ürün", scheduledTime:"07:15", repeatType:"cycle", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"İçtim", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30], cycleLength:5, cycleDays:[3,4], note:"500 ml suya Aloe Vera, Multifiber ve Herbalife çay ekle"},
      {title:"Shake", type:"supplement", section:"Ürün", scheduledTime:"07:45", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"İçtim", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30], note:"400 ml suya 2 tepeleme çorba kaşığı shake ekle"},
      {title:"Çay ve meyve", type:"meal", section:"Öğün", scheduledTime:"11:00", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Fotoğraf Ekle", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30], note:"Herbalife çay ve 1 porsiyon taze veya kuru meyve"},
      {title:"Öğle yemeği", type:"meal", section:"Öğün", scheduledTime:"12:30", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Öğünü Kaydet", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30,60], note:"Protein, karbonhidrat ve lif dengeli tabak"},
      {title:"Çay ve kuruyemiş", type:"meal", section:"Öğün", scheduledTime:"16:00", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Fotoğraf Ekle", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30], note:"Herbalife çay ve çiğ kuruyemiş"},
      {title:"Akşam yemeği", type:"meal", section:"Öğün", scheduledTime:"17:30", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Öğünü Kaydet", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30,60], note:"Sebze yemeği ve bol salata, en geç 19:00'da bitmeli"}
    ]
  },
  {
    id:"weight-gain", name:"Kilo Alma Programı", desc:"Bol yumurtalı kahvaltı, promax shake, zengin ana öğünler, yağlı kuruyemiş ara öğünü ve gece shake desteği", duration:"30 gün", variantNote:"Kilo alma", bannedFoods:["Paketli gıda", "Şekerli içecek", "Kızartma", "Aşırı kafein"], quickRules:["Her görevde kamera kanıtı zorunludur", "Ana öğünler zengin içerikli hazırlanır", "Promax shake sabah kahvaltıdan sonra ve gece yatmadan önce uygulanır", "Gece shake içildikten sonra uykuya geçilir"], cautionNotes:["İştah düşükse koça not bırakılır", "Hedef dışı ürün değişimi koçla yapılır", "Ara öğünde yağlı kuruyemişler öncelikli tüketilir"],
    tasks:[
      {title:"Bol yumurtalı kahvaltı", type:"meal", section:"Kahvaltı", scheduledTime:"08:00", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Fotoğraf Ekle", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30], note:"Bol yumurtalı, zengin içerikli kahvaltı yap. Kahvaltı fotoğrafını ekle."},
      {title:"Kahvaltı sonrası promax shake", type:"supplement", section:"Kahvaltı", scheduledTime:"09:00", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"İçtim", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30], note:"Kahvaltıdan sonra: 300 ml süt + 200 ml suya 2 yemek kaşığı Promax, 2 kaşık shake, 1 adet muz, 1 avuç fındık ve 2 yemek kaşığı yulaf ekle. Robottan geçir ve iç."},
      {title:"Öğle yemeği", type:"meal", section:"Ana Öğün", scheduledTime:"13:00", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Fotoğraf Ekle", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30,60], note:"13:00: Protein, lif ve karbonhidrat içeren dengeli ve zengin menü. Yanında 1 Xtracall, 1 Omega, 1 erkek vitamini. Örnek: çorba, salata, ana yemek; yanında bulgur pilavı veya ekmek."},
      {title:"Ara öğün", type:"meal", section:"Ara Öğün", scheduledTime:"15:00", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Fotoğraf Ekle", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30,60], note:"15:00-18:00: Karışık kuruyemişler ve meyve tüketilebilir. Yağlı kuruyemişleri özellikle tüket; fındık, badem, ceviz gibi."},
      {title:"Akşam yemeği", type:"meal", section:"Ana Öğün", scheduledTime:"18:00", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"Fotoğraf Ekle", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30,60], note:"18:00-19:00: Kurubaklagil, salata ve protein ağırlıklı zengin yemek. Yanında 1 Xtracall, 1 Omega, 1 erkek vitamini. Örnek: pirinçli kıymalı ıspanak yemeği, yanında ekmek ve salata."},
      {title:"Gece promax shake", type:"supplement", section:"Gece", scheduledTime:"22:30", repeatType:"daily", repeatDays:[1,2,3,4,5,6,7], buttonLabel:"İçtim", photoRequired:true, snoozeEnabled:true, snoozeOptions:[15,30], note:"Gece yatmadan önce: 2 kaşık shake + 2 kaşık Promax + 1 muz + 1 avuç fındık. Robottan geçir, iç ve uykuya geç."}
    ]
  }
];

const templateTasks = (templateId) => selectTemplateTasks(PROGRAM_TEMPLATES,templateId);
const taskTitles = (templateId) => selectTaskTitles(PROGRAM_TEMPLATES,templateId);
const getTemplateByClient = (client) => selectTemplateByClient({client,templates:PROGRAM_TEMPLATES,programs:DB?.programs?.()||[],users:DB?.users?.()||[]});

const STEPWISE_TASKS = PROGRAM_TEMPLATES[1].tasks.map((t,i)=>({l:t.title, alarm:t.scheduledTime, photo:t.photoRequired, type:t.type, c:[C.warn,C.jade,C.blue,C.purple,C.emerald][i%5], bg:["#fff4e0",C.mint,C.blueBg,C.purpleBg,C.foam][i%5]}));
const allPrograms=(coachId)=>selectAllPrograms({coachId,templates:PROGRAM_TEMPLATES,programs:DB?.programs?.()||[],users:DB?.users?.()||[]});
const programById=(id,coachId)=>selectProgramById({id,coachId,templates:PROGRAM_TEMPLATES,programs:DB?.programs?.()||[],users:DB?.users?.()||[]});
const displayProgram=(client)=>selectDisplayProgram({client,templates:PROGRAM_TEMPLATES,programs:DB?.programs?.()||[],users:DB?.users?.()||[]});
const clientHasStarted=(client)=>selectClientHasStarted(client,todayKey());
const isRiskClient=(client)=>{
  return selectRiskClient(client,todayKey());
};
const clientStartAt=(u)=>selectClientStartAt(u,todayKey());
const videoActive=(v)=>selectVideoActive(v);
const programVideoForAssignment=(program)=>selectProgramVideoForAssignment(program,todayKey());
const proofTaskPlan=(client)=>selectProofTaskPlan({client,templates:PROGRAM_TEMPLATES,programs:DB?.programs?.()||[],users:DB?.users?.()||[]});
const coachProofActions=(coachId,users=DB.users())=>getCoachProofActions({coachId,users,getTaskPlan:proofTaskPlan,todayKey:todayKey()});
const updateCoachProofStatus=(coachId,clientId,idx,status)=>{
  const key=todayKey();
  const result=applyCoachProofStatus({users:DB.users(),coachId,clientId,idx,status,todayKey:key,getTaskPlan:proofTaskPlan});
  DB.setUsers(result.users);
  DB.setTaskLogs([createProofReviewLog({clientId,coachId,taskTitle:result.taskTitle,status,todayKey:key}),...DB.taskLogs()].slice(0,120));
};
const ImageLightbox=({media,title,subtitle,onClose})=>{
  useBackClose(true,onClose);
  return <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1200,background:"rgba(4,14,10,.9)",display:"flex",flexDirection:"column",padding:"calc(18px + env(safe-area-inset-top)) 16px calc(20px + env(safe-area-inset-bottom))",boxSizing:"border-box"}}>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:16,fontWeight:900,color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",...F}}>{title||"Fotoğraf"}</div>{subtitle&&<div style={{fontSize:12,color:"rgba(255,255,255,.68)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",...F}}>{subtitle}</div>}</div>
      <button onClick={onClose} style={{border:"1px solid rgba(255,255,255,.18)",background:"rgba(255,255,255,.12)",color:C.white,borderRadius:14,padding:"10px 13px",fontSize:12,fontWeight:900,flexShrink:0,...F}}>Kapat</button>
    </div>
    <div style={{flex:1,minHeight:0,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.stopPropagation()}>
      <MediaImage media={media} alt={title||"Fotoğraf"} style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",borderRadius:18,boxShadow:"0 24px 80px rgba(0,0,0,.45)",background:C.ink}}/>
    </div>
  </div>;
};
const collectMediaIds=(users=[])=>[
  ...users.flatMap(u=>[
    u.avatarMediaId,
    u.productVideo?.mediaId,
    u.productVideoDraft?.mediaId,
    ...(u.productVideos||[]).map(v=>v.mediaId),
    ...Object.values(u.photoProofs||{}).map(p=>p.mediaId),
    ...Object.values(u.dailyTasks||{}).flatMap(d=>Object.values(d.photoProofs||{}).map(p=>p.mediaId)),
  ]),
  ...(DB.programs?.()||[]).map(p=>p.productVideo?.mediaId),
  ...DB.msgs().map(m=>m.mediaId),
].filter(Boolean);

const SEED_USERS = [
  { id:"admin1", role:"admin", name:"Admin", email:"admin@stepwise.app", password:"admin123", createdAt:"2024-01-01", status:"active" },
  { id:"coach1", role:"coach", name:"Test Koç", email:"koc.test0306@stepwiseplus.app", password:"test123", refCode:"TESTAPK", phone:"+90 555 111 22 33", createdAt:"2026-06-03", status:"active", clients:["client1","client2","client3"], clientMessagesOpen:true },
  { id:"client1", role:"client", name:"Test Danışan", email:"danisan.test0306@stepwiseplus.app", password:"test123", coachId:"coach1", coachRef:"TESTAPK", phone:"+90 555 234 10 20", program:"Program atanmadı", goal:"Program atama testi", createdAt:"2026-06-03", createdAtTime:"2026-06-03T09:00:00.000Z", startedAt:"2026-06-03T09:00:00.000Z", programStartDate:"2026-06-03", programEndDate:"2026-07-03", status:"active", compliance:0, tasks:[], pendingToday:0, missedToday:0, photoPendingToday:0, weeklyAverage:0, streakDays:4, body:{height:170,age:30,gender:"female",start:80,current:80,target:70,water:50,fat:30,muscle:34,bmi:27.7,waist:88,hip:103,chest:94,ideal:"62-68 kg"} },
  { id:"client2", role:"client", name:"Elif Yılmaz", email:"elif.test0306@stepwiseplus.app", password:"test123", coachId:"coach1", coachRef:"TESTAPK", phone:"+90 555 333 44 55", program:"4 Temel Program", programTemplateId:"four-foundation", goal:"Kilo kontrolü ve enerji takibi", createdAt:"2026-06-03", createdAtTime:"2026-06-03T09:00:00.000Z", startedAt:"2026-06-03T09:00:00.000Z", programStartDate:"2026-06-03", programEndDate:"2026-07-03", status:"active", compliance:80, tasks:[true,true,false,false,false,false,false], pendingToday:5, missedToday:0, photoPendingToday:5, weeklyAverage:82, streakDays:5, body:{height:168,age:31,gender:"female",start:72,current:67.5,target:63,water:52.4,fat:27.8,muscle:35.1,bmi:24.2,waist:78,hip:99,chest:91,ideal:"58-64 kg"} },
  { id:"client3", role:"client", name:"Mert Demir", email:"mert.test0306@stepwiseplus.app", password:"test123", coachId:"coach1", coachRef:"TESTAPK", phone:"+90 555 444 55 66", program:"Kilo Alma Programı", programTemplateId:"weight-gain", goal:"Sağlıklı kilo alma ve öğün düzeni", createdAt:"2026-06-03", createdAtTime:"2026-06-03T09:00:00.000Z", startedAt:"2026-06-03T09:00:00.000Z", programStartDate:"2026-06-03", programEndDate:"2026-07-03", status:"active", compliance:65, tasks:[true,false,false,false,false,false], pendingToday:5, missedToday:1, photoPendingToday:5, weeklyAverage:68, streakDays:2, body:{height:181,age:36,gender:"male",start:64,current:65.8,target:72,water:49.1,fat:22.4,muscle:38.8,bmi:20.1,waist:78,hip:94,chest:96,ideal:"76-82 kg"} },
];
const SEED_MSGS = [
  { id:"m1", from:"coach1", to:"client1", text:"Test mesajı: program atanınca buradan takip edeceğiz.", time:"09:00", date:"2026-06-03", readBy:["coach1"] },
  { id:"m2", from:"client1", to:"coach1", text:"Tamam koçum, görevlere bakacağım.", time:"09:05", date:"2026-06-03", readBy:["client1"] },
  { id:"m3", from:"coach1", to:"client2", text:"Elif, sabah tartı fotoğrafını bekliyorum.", time:"09:30", date:"2026-06-03", readBy:["coach1"] },
];
const SEED_SESS = [
  { id:"s1", coachId:"coach1", clientId:"client1", type:"İlerleme değerlendirme", date:"2026-06-10", time:"14:30", duration:"60 dk", status:"confirmed" },
  { id:"s2", coachId:"coach1", clientId:"client2", type:"Öğün planı revizyonu", date:"2026-06-11", time:"10:00", duration:"30 dk", status:"confirmed" },
];
const SEED_CODES = [{code:"COACH-MASTER-2026",status:"active",createdAt:"2026-06-03",usedBy:null,usedAt:null}];

const DB = {
  get:(k)=>{ try{return JSON.parse(localStorage.getItem("ct_"+k));}catch{return null;} },
  set:(k,v)=>{ try{localStorage.setItem("ct_"+k,JSON.stringify(v));}catch{} },
  init:()=>{
    const seedVersion="stepwise-v11-test-clean";
    if(!DB.get("users")||DB.get("seedVersion")!==seedVersion){
      DB.set("users",SEED_USERS); DB.set("msgs",SEED_MSGS); DB.set("sess",SEED_SESS); DB.set("taskLogs",[]); DB.set("auditLogs",[]); DB.set("seeded",true);
    }
    if(!DB.get("msgs"))DB.set("msgs",SEED_MSGS);
    if(!DB.get("sess"))DB.set("sess",SEED_SESS);
    if(!DB.get("taskLogs"))DB.set("taskLogs",[]);
    if(!DB.get("auditLogs"))DB.set("auditLogs",[]);
    if(!DB.get("programs"))DB.set("programs",[]);
    DB.set("programs",uniquePrograms(DB.programs()).filter(p=>p?.name&&p?.tasks?.length));
    if(!DB.get("coachCodes"))DB.set("coachCodes",SEED_CODES);
    DB.set("users",normalizeUsers(DB.users()).map(u=>u.programTemplateId==="six-foundation"?{...u,program:"Maxi 6 Temel"}:u));
    DB.set("seedVersion",seedVersion);
  },
  users:()=>DB.get("users")||[],
  setUsers:(u)=>DB.set("users",u),
  msgs:()=>DB.get("msgs")||[],
  setMsgs:(m)=>DB.set("msgs",m),
  sess:()=>DB.get("sess")||[],
  setSess:(s)=>DB.set("sess",s),
  taskLogs:()=>DB.get("taskLogs")||[],
  setTaskLogs:(l)=>DB.set("taskLogs",l),
  auditLogs:()=>DB.get("auditLogs")||[],
  setAuditLogs:(l)=>DB.set("auditLogs",l),
  programs:()=>DB.get("programs")||[],
  setPrograms:(p)=>DB.set("programs",p),
  coachCodes:()=>DB.get("coachCodes")||[],
  setCoachCodes:(c)=>DB.set("coachCodes",c),
};
const todayKey=()=>new Date().toISOString().split("T")[0];
const recordAudit=async({actor,action,targetTable,targetId,metadata={}})=>{
  const entry={id:"audit"+Date.now(),actorId:actor?.id,actorName:actor?.name,action,targetTable,targetId,metadata,date:todayKey(),time:new Date().toLocaleTimeString("tr",{hour:"2-digit",minute:"2-digit"})};
  DB.setAuditLogs([entry,...DB.auditLogs()].slice(0,200));
  if(isProductionMode()&&actor?.supabaseToken){
    try{await createAuditLog({action,targetTable,targetId,metadata},actor.supabaseToken);}catch(err){console.warn("cloud-audit",err);}
  }
  return entry;
};
const unreadMessagesFor=(userId,fromId=null)=>selectUnreadMessagesFor(DB.msgs(),userId,fromId);
const unreadCount=(user)=>selectUnreadCount(DB.msgs(),user);
const unreadCountFrom=(userId,fromId)=>selectUnreadCountFrom(DB.msgs(),userId,fromId);
const markMessagesRead=(userId,fromId=null)=>{
  const {messages:next,changed}=markMessagesReadState(DB.msgs(),userId,fromId);
  if(changed)DB.setMsgs(next);
  return changed;
};
const taskCycleIndexFor=(user)=>{
  const start=clientStartAt(user);
  return (daysBetween(start)-1)%5;
};
const isTaskActiveToday=(task,user)=>selectTaskActiveToday(task,user,todayKey());
const addNotice=(userId,text,type="info")=>{
  if(!userId)return;
  DB.setUsers(addNoticeToUsers(DB.users(),userId,createLocalNotice({text,type,date:todayKey()})));
};
const activeCoachNotes=(client)=>selectActiveCoachNotes(client);
const addCoachNote=(coach,clientIds,text)=>{
  const clean=(text||"").trim();
  if(!coach?.id||!clean||!clientIds?.length)return [];
  const now=Date.now();
  const time=new Date().toLocaleTimeString("tr",{hour:"2-digit",minute:"2-digit"});
  const created=[];
  DB.setUsers(DB.users().map(u=>{
    if(!clientIds.includes(u.id))return u;
    const note={id:`cn-${coach.id}-${u.id}-${now}`,coachId:coach.id,coachName:coach.name,text:clean,date:todayKey(),time,createdAt:now,read:false};
    created.push({clientId:u.id,note});
    return {...u,coachNotes:[note,...(u.coachNotes||[]).filter(n=>n.date===todayKey()).slice(0,9)]};
  }));
  return created;
};
const dismissCoachNote=(clientId,noteId)=>{
  if(!clientId||!noteId)return;
  DB.setUsers(applyDismissCoachNote(DB.users(),clientId,noteId));
};
const showLocalNotice=async(title,body)=>{
  await showBrowserNotification(title,body);
};
const fmtDuration=(seconds=0)=>`${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
const useKeyboardOpen=()=>{
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    const update=()=>{
      const viewport=window.visualViewport;
      const height=viewport?.height||window.innerHeight;
      setOpen(window.innerHeight-height>120);
    };
    update();
    window.visualViewport?.addEventListener("resize",update);
    window.addEventListener("resize",update);
    return ()=>{
      window.visualViewport?.removeEventListener("resize",update);
      window.removeEventListener("resize",update);
    };
  },[]);
  return open;
};
const useEditableFocus=()=>{
  const [focused,setFocused]=useState(false);
  useEffect(()=>{
    const isEditable=(el)=>{
      const tag=(el?.tagName||"").toLowerCase();
      return tag==="input"||tag==="textarea"||el?.isContentEditable;
    };
    const update=()=>setFocused(isEditable(document.activeElement));
    const handleBlur=()=>setTimeout(update,80);
    update();
    document.addEventListener("focusin",update);
    document.addEventListener("focusout",handleBlur);
    window.addEventListener("resize",update);
    return ()=>{
      document.removeEventListener("focusin",update);
      document.removeEventListener("focusout",handleBlur);
      window.removeEventListener("resize",update);
    };
  },[]);
  return focused;
};
const useBackClose=(active,onClose)=>{
  const closeRef=useRef(onClose);
  useEffect(()=>{closeRef.current=onClose;},[onClose]);
  useEffect(()=>{
    if(!active||typeof window==="undefined")return;
    try{window.history.pushState({...(window.history.state||{}),stepwiseModal:true},"");}catch{}
    const onPop=()=>closeRef.current?.();
    window.addEventListener("popstate",onPop);
    return ()=>window.removeEventListener("popstate",onPop);
  },[active]);
};
const currentClientTasks=(user)=>{
  try{
    if(!user||user.role==="coach"||user.role==="admin")return [];
    if(!hasAssignedProgram(user))return [];
    const template=user.programDraft||getTemplateByClient(user)||{};
    const rawTasks=Array.isArray(template.tasks)&&template.tasks.length?template.tasks:templateTasks(user.programTemplateId);
    return normalizeProgramTasksForCycle(rawTasks||[])
      .map((t,i)=>({...t,idx:i}))
      .filter(t=>isTaskActiveToday(t,user))
      .map((t,i)=>({idx:t.idx,l:t.title||`Görev ${i+1}`,alarm:taskTimeFor(t,user)||t.scheduledTime||"09:00",photo:true,type:t.type||"task",section:t.section||"Genel",buttonLabel:t.buttonLabel||"Tamamlandı",note:t.note||"",productImage:t.productImage||"",snoozeEnabled:t.snoozeEnabled!==false,snoozeOptions:t.snoozeOptions||[15,30,60],c:[C.warn,C.jade,C.blue,C.purple,C.emerald][i%5],bg:["#fff4e0",C.mint,C.blueBg,C.purpleBg,C.foam][i%5]}));
  }catch(err){
    console.warn("current-client-tasks",err,user?.id);
    return [];
  }
};
const currentPendingCount=(user)=>{
  const tasks=currentClientTasks(user);
  if(!tasks.length)return 0;
  return dailyStateFor(user,tasks).tasks.filter(x=>!x).length;
};
const authUser=(email,password)=>authenticateUser({email,password,users:DB.users(),seedUsers:SEED_USERS,setUsers:DB.setUsers});

const IC = {
  home:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  clients:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100 8 4 4 0 000-8 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  cal:"M8 2v4 M16 2v4 M3 10h18 M21 8H3a2 2 0 00-2 2v11a2 2 0 002 2h18a2 2 0 002-2V10a2 2 0 00-2-2z",
  msg:"M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  chart:"M18 20V10 M12 20V4 M6 20v-6",
  bell:"M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
  back:"M19 12H5 M12 19l-7-7 7-7",
  send:"M22 2L11 13 M22 2L15 22l-4-9-9-4z",
  check:"M20 6L9 17l-5-5",
  plus:"M12 5v14 M5 12h14",
  mic:"M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z M19 10v2a7 7 0 01-14 0v-2 M12 19v4 M8 23h8",
  search:"M21 21l-4.35-4.35 M17 11A6 6 0 105 11a6 6 0 0012 0z",
  chev:"M9 18l6-6-6-6",
  warn:"M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  cam:"M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a4 4 0 100-8 4 4 0 000 8",
  alarm:"M12 22a10 10 0 100-20 10 10 0 000 20 M12 6v6l4 2 M4.93 4.93l1.41 1.41 M17.66 4.93l-1.41 1.41",
  trash:"M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6",
  eye:"M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12 M12 15a3 3 0 100-6 3 3 0 000 6",
  shield:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  mail:"M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z M22 6l-10 7L2 6",
  lock:"M7 11V8a5 5 0 0110 0v3 M6 11h12a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8a1 1 0 011-1z",
  user:"M20 21a8 8 0 00-16 0 M12 11a4 4 0 100-8 4 4 0 000 8",
  users:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  award:"M12 15a6 6 0 100-12 6 6 0 000 12 M9 14l-1 8 4-2 4 2-1-8",
  copy:"M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
  logout:"M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
  target:"M12 22a10 10 0 100-20 10 10 0 000 20 M12 18a6 6 0 100-12 6 6 0 000 12 M12 14a2 2 0 100-4 2 2 0 000 4",
  activity:"M22 12h-4l-3 9L9 3l-3 9H2",
  settings:"M12 15a3 3 0 100-6 3 3 0 000 6 M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  download:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
};

const Av=({ini,size=40,bg=C.mint,fg=C.emerald})=>(
  <div style={{width:size,height:size,borderRadius:"50%",background:bg,color:fg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:Math.max(size*.3,10),flexShrink:0,...F}}>{ini||"?"}</div>
);
const Avatar=({user,size=40,bg=C.mint,fg=C.emerald})=>user?.avatarUrl||user?.avatarMediaId
  ? <MediaImage media={{url:user.avatarUrl,mediaId:user.avatarMediaId,storageBucket:user.avatarMedia?.storageBucket,storagePath:user.avatarMedia?.storagePath}} alt="" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:`3px solid ${bg}`,boxShadow:"0 10px 24px rgba(13,61,43,.18)"}}/>
  : <Av ini={ini(user?.name)} size={size} bg={bg} fg={fg}/>;
const COVER_THEMES=[`linear-gradient(135deg,${C.emerald},${C.forest})`,`linear-gradient(135deg,#2b7a78,#17252a)`,`linear-gradient(135deg,#3b7dd8,#102a43)`,`linear-gradient(135deg,#7c5cdb,#2c1a63)`,`linear-gradient(135deg,#d99a24,#7a3f12)`];
const coverBg=(u)=>u?.coverBg||COVER_THEMES[0];
const SWPMonogram=({size=96,width,height,animated=false,flat=false,variant})=>{
  const w=width||size, h=height||size;
  const wn=typeof w==="number"?w:(parseFloat(w)||size);
  const hn=typeof h==="number"?h:(parseFloat(h)||size);
  const src=variant==="wide"?"/stepwise-swp-wide.png":variant==="mark"?"/stepwise-swp-mark.png":wn>hn*1.15?"/stepwise-swp-wide.png":"/stepwise-swp-mark.png";
  return(
  <div className={animated?"swp-mark swp-mark-animated":"swp-mark"} style={{width:w,height:h,borderRadius:flat?0:Math.min(wn,hn)*.24,position:"relative",overflow:"hidden",background:flat?"transparent":"linear-gradient(145deg,#06111e,#0b201c)",boxShadow:flat?"none":"0 24px 52px rgba(0,0,0,.4)",border:flat?"none":"1px solid rgba(255,255,255,.14)",flexShrink:0}}>
    {animated&&["s","w","p"].map(part=><img key={part} className={`swp-piece swp-piece-${part}`} src={src} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>)}
    <img className={animated?"swp-final-mark":""} src={src} alt="StepWise Plus" style={{position:animated?"absolute":"relative",inset:animated?0:undefined,width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
  </div>
  );
};
const AdminUserEditor=({target,users,admin,onClose,onSaved})=>{
  const [form,setForm]=useState(()=>({
    name:target?.name||"",
    email:target?.email||"",
    phone:target?.phone||"",
    status:target?.status||"active",
    coachId:target?.coachId||"",
    refCode:target?.refCode||"",
    programStartDate:target?.programStartDate||target?.createdAt||todayKey(),
    programEndDate:target?.programEndDate||"",
  }));
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");
  if(!target)return null;
  const coaches=users.filter(u=>u.role==="coach");
  const owned=target.role==="coach"?users.filter(u=>u.role==="client"&&u.coachId===target.id):[];
  const save=async()=>{
    if(!form.name.trim()||!form.email.trim()){setErr("Ad soyad ve e-posta zorunlu.");return;}
    setSaving(true);setErr("");
    const updated={...target,name:form.name.trim(),email:form.email.trim().toLowerCase(),phone:form.phone.trim(),status:form.status,coachId:target.role==="client"?form.coachId||null:target.coachId,refCode:target.role==="coach"?form.refCode.trim().toUpperCase():target.refCode,programStartDate:target.role==="client"?form.programStartDate:target.programStartDate,programEndDate:target.role==="client"?form.programEndDate:target.programEndDate};
    try{
      if(isProductionMode()&&admin.supabaseToken){
        await supabaseRest("profiles",{
          method:"PATCH",
          token:admin.supabaseToken,
          query:`?id=eq.${target.id}`,
          body:{
            name:updated.name,
            email:updated.email,
            status:updated.status,
            coach_id:target.role==="client"?updated.coachId:null,
            ref_code:target.role==="coach"?updated.refCode:null,
            program_start_date:target.role==="client"?updated.programStartDate:null,
            program_end_date:target.role==="client"?updated.programEndDate||null:null,
          },
        });
      }
      DB.setUsers(DB.users().map(u=>u.id===target.id?updated:u));
      await recordAudit({actor:admin,action:"admin_user_updated",targetTable:"profiles",targetId:target.id,metadata:{name:updated.name,role:updated.role,status:updated.status}});
      onSaved?.(updated);
    }catch(e){
      console.warn("admin-user-save",e);
      setErr("Kullanıcı kaydedilemedi.");
    }finally{setSaving(false);}
  };
  const Info=({l,v})=><div style={{background:C.foam,borderRadius:12,padding:"10px 12px"}}><div style={{fontSize:10,color:C.stone,fontWeight:800,marginBottom:3,...F}}>{l}</div><div style={{fontSize:12,color:C.ink,fontWeight:800,wordBreak:"break-word",...F}}>{v||"-"}</div></div>;
  const input=(k,l,type="text")=><div style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:900,color:C.ink,marginBottom:5,...F}}>{l}</div><input type={type} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${C.mint}`,borderRadius:13,padding:"11px 12px",fontSize:13,outline:"none",color:C.ink,background:C.white,...F}}/></div>;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(6,15,25,.72)",zIndex:260,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{width:"100%",maxWidth:720,maxHeight:"92dvh",overflowY:"auto",background:C.white,borderRadius:"24px 24px 0 0",padding:18,boxSizing:"border-box",boxShadow:"0 -24px 60px rgba(0,0,0,.22)"}}>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
          <Avatar user={target} size={54}/>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:18,fontWeight:950,color:C.ink,...F}}>{target.name}</div><div style={{fontSize:12,color:C.stone,...F}}>{target.role==="coach"?"Koç":"Danışan"} · {target.status==="banned"?"Askıda":"Aktif"}</div></div>
          <button onClick={onClose} style={{border:"none",background:C.foam,color:C.stone,borderRadius:12,padding:"9px 12px",fontWeight:900,...F}}>Kapat</button>
        </div>
        {err&&<div style={{background:"#fde8e6",color:C.risk,borderRadius:12,padding:"10px 12px",fontSize:12,fontWeight:800,marginBottom:10,...F}}>{err}</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:14}}>
          <Info l="E-posta" v={target.email}/><Info l="Kayıt" v={target.createdAt||target.createdAtTime?.slice?.(0,10)}/>
          <Info l="Bağlı Koç" v={target.role==="client"?(users.find(u=>u.id===target.coachId)?.name||"Atanmamış"):"-"} />
          <Info l="Danışan Sayısı" v={target.role==="coach"?owned.length:"-"} />
        </div>
        <Card style={{padding:"14px",marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:950,color:C.ink,marginBottom:10,...F}}>Genel Bilgiler</div>
          {input("name","Ad soyad")}
          {input("email","E-posta","email")}
          {input("phone","Telefon")}
          <div style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:900,color:C.ink,marginBottom:5,...F}}>Durum</div><select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${C.mint}`,borderRadius:13,padding:"11px 12px",fontSize:13,outline:"none",color:C.ink,background:C.white,...F}}><option value="active">Aktif</option><option value="banned">Askıda / Yasaklı</option></select></div>
          {target.role==="coach"&&input("refCode","Koç referans kodu")}
          {target.role==="client"&&<>
            <div style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:900,color:C.ink,marginBottom:5,...F}}>Bağlı koç</div><select value={form.coachId||""} onChange={e=>setForm(f=>({...f,coachId:e.target.value}))} style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${C.mint}`,borderRadius:13,padding:"11px 12px",fontSize:13,outline:"none",color:C.ink,background:C.white,...F}}><option value="">Koç seçilmedi</option>{coaches.map(c=><option key={c.id} value={c.id}>{c.name} · {c.refCode||"-"}</option>)}</select></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{input("programStartDate","Başlangıç tarihi","date")}{input("programEndDate","Bitiş tarihi","date")}</div>
          </>}
        </Card>
        {target.role==="coach"&&<Card style={{padding:"14px",marginBottom:12}}><div style={{fontSize:14,fontWeight:950,color:C.ink,marginBottom:10,...F}}>Bağlı Danışanlar</div>{owned.length===0?<div style={{fontSize:12,color:C.stone,...F}}>Bu koça bağlı danışan yok.</div>:owned.map(c=><div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${C.foam}`}}><Avatar user={c} size={34}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:900,color:C.ink,...F}}>{c.name}</div><div style={{fontSize:11,color:C.stone,...F}}>{c.email}</div></div><Pill bg={c.status==="banned"?"#fde8e6":C.mint} color={c.status==="banned"?C.risk:C.emerald}>{c.status==="banned"?"Askıda":"Aktif"}</Pill></div>)}</Card>}
        <button disabled={saving} onClick={save} style={{width:"100%",border:"none",background:saving?C.stone:C.emerald,color:C.white,borderRadius:16,padding:"14px",fontSize:14,fontWeight:950,...F}}>{saving?"Kaydediliyor...":"Bilgileri Kaydet"}</button>
      </div>
    </div>
  );
};
const StepWiseSplash=()=>(
  <div style={{position:"fixed",inset:0,zIndex:9999,background:"radial-gradient(circle at 50% 42%,#112a24 0%,#0b1727 42%,#070f1c 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none",overflow:"hidden"}}>
    <style>{`
      @keyframes swpSIn{0%{opacity:0;transform:translate(-82px,-72px) rotate(-18deg) scale(.78)}72%{opacity:1;transform:translate(4px,2px) rotate(2deg) scale(1.04)}100%{opacity:1;transform:translate(0,0) rotate(0) scale(1)}}
      @keyframes swpWIn{0%{opacity:0;transform:translate(-92px,76px) rotate(16deg) scale(.76)}72%{opacity:1;transform:translate(3px,-3px) rotate(-2deg) scale(1.05)}100%{opacity:1;transform:translate(0,0) rotate(0) scale(1)}}
      @keyframes swpPIn{0%{opacity:0;transform:translate(86px,70px) rotate(18deg) scale(.76)}72%{opacity:1;transform:translate(-3px,-2px) rotate(-2deg) scale(1.05)}100%{opacity:1;transform:translate(0,0) rotate(0) scale(1)}}
      @keyframes swpMarkPop{0%{transform:scale(.82);opacity:.2}55%{transform:scale(1.06);opacity:1}100%{transform:scale(1);opacity:1}}
      @keyframes swpNameIn{0%{opacity:0;transform:translateY(16px);filter:blur(5px)}100%{opacity:1;transform:translateY(0);filter:blur(0)}}
      @keyframes swpFinalIn{0%,70%{opacity:0}100%{opacity:1}}
      .swp-mark-animated{animation:swpMarkPop .95s cubic-bezier(.2,.82,.2,1) both}
      .swp-piece{transform-origin:center;filter:drop-shadow(0 12px 18px rgba(0,0,0,.38))}
      .swp-piece-s{clip-path:inset(0 34% 46% 0);animation:swpSIn 1.18s cubic-bezier(.2,.82,.2,1) .12s both}
      .swp-piece-w{clip-path:inset(34% 36% 13% 5%);animation:swpWIn 1.18s cubic-bezier(.2,.82,.2,1) .28s both}
      .swp-piece-p{clip-path:inset(18% 0 8% 43%);animation:swpPIn 1.18s cubic-bezier(.2,.82,.2,1) .42s both}
      .swp-final-mark{opacity:0;animation:swpFinalIn .55s ease-out 1.25s forwards}
    `}</style>
    <SWPMonogram width={250} height={145} animated flat variant="wide"/>
    <div style={{marginTop:30,fontSize:38,fontWeight:950,letterSpacing:.5,color:C.white,textShadow:"0 12px 30px rgba(0,0,0,.55)",animation:"swpNameIn .65s ease-out 1.35s both",...F}}>StepWise <span style={{color:"#a7ec3a"}}>Plus</span></div>
    <div style={{marginTop:10,fontSize:14,fontWeight:700,color:"rgba(255,255,255,.68)",animation:"swpNameIn .65s ease-out 1.55s both",...F}}>Koç & Danışan Takip Sistemi</div>
  </div>
);
const taskTimeFor=(task,user)=>{
  const prefs=user.schedulePrefs||{};
  if(prefs.taskTimes&&task.idx!==undefined&&prefs.taskTimes[task.idx])return prefs.taskTimes[task.idx];
  if(task.type==="supplement"||task.section==="Ürün") return prefs.morningProduct||task.scheduledTime;
  if(task.type==="meal"||task.section==="Öğün") return prefs.mealPhoto||task.scheduledTime;
  if(task.type==="movement"||task.section==="Hareket") return prefs.walk||task.scheduledTime;
  return task.scheduledTime;
};
class ScreenBoundary extends React.Component{
  constructor(props){super(props);this.state={error:null};}
  static getDerivedStateFromError(error){return {error};}
  componentDidCatch(error,info){console.warn("screen-crash",error,info);}
  render(){
    if(this.state.error){
      return <div style={{flex:1,background:C.mist,padding:"28px 20px",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Card style={{padding:"18px",textAlign:"center",maxWidth:360}}>
          <div style={{fontSize:18,fontWeight:900,color:C.ink,marginBottom:8,...F}}>Ekran yenilendi</div>
          <div style={{fontSize:12,color:C.stone,lineHeight:1.45,marginBottom:14,...F}}>Bu bölümde hatalı bir kayıt yakalandı. Ana ekrana dönüp devam edebilirsin.</div>
          <button onClick={this.props.onReset} style={{border:"none",background:C.emerald,color:C.white,borderRadius:14,padding:"11px 14px",fontSize:13,fontWeight:900,...F}}>Özete Dön</button>
        </Card>
      </div>;
    }
    return this.props.children;
  }
}
const useAnim=(dep)=>{
  const [v,setV]=useState(0);
  useEffect(()=>{
    setV(0);let s;
    const t=setTimeout(()=>{let st;const f=ts=>{if(!st)st=ts;const p=Math.min((ts-st)/700,1);setV(p);if(p<1)s=requestAnimationFrame(f);};s=requestAnimationFrame(f);},150);
    return()=>{clearTimeout(t);cancelAnimationFrame(s);};
  },[dep]);
  return v;
};

const StatusBar=()=>(
  <div style={{height:50,display:"flex",alignItems:"flex-end",justifyContent:"space-between",padding:"0 28px 8px"}}>
    <span style={{fontSize:13,fontWeight:700,color:C.ink,...F}}>9:41</span>
    <div style={{display:"flex",gap:5,alignItems:"center"}}>
      {[12,9,6].map((h,i)=><div key={i} style={{width:3,height:h,background:i<2?C.forest:C.pebble,borderRadius:1.5}}/>)}
      <div style={{width:22,height:11,borderRadius:3,border:`1.5px solid ${C.forest}`,display:"flex",alignItems:"center",padding:"1.5px 2px",gap:1,marginLeft:3}}>
        <div style={{flex:2,background:C.jade,borderRadius:1,height:"100%"}}/>
        <div style={{flex:1,background:C.pebble,borderRadius:1,height:"100%"}}/>
      </div>
    </div>
  </div>
);
const HomeBar=()=>(
  <div style={{height:28,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{width:120,height:4,background:C.forest,borderRadius:2,opacity:.2}}/>
  </div>
);
const BotNav=({tabs,active,onNav})=>(
  <div style={{display:"flex",background:"rgba(255,255,255,.9)",borderTop:"1px solid rgba(209,241,220,.9)",padding:"8px 0 max(8px, env(safe-area-inset-bottom))",boxShadow:"0 -18px 42px rgba(18,112,61,.14)",backdropFilter:"blur(20px)",flexShrink:0}}>
    {tabs.map(t=>{const on=active===t.id;return(
      <button key={t.id} onClick={()=>onNav(t.id)} style={{flex:1,border:"none",background:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0",cursor:"pointer",position:"relative"}}>
        <div style={{width:42,height:30,borderRadius:15,background:on?"linear-gradient(135deg,#e9faef,#d7f6dd)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .2s",boxShadow:on?"0 8px 18px rgba(21,148,68,.16)":"none",border:on?"1px solid rgba(31,166,75,.18)":"1px solid transparent"}}>
          <Ico d={t.icon} size={18} color={on?"#009f3d":C.stone} stroke={on?2.4:1.7}/>
          {t.badge>0&&!on&&<div style={{position:"absolute",top:-3,right:"50%",marginRight:-23,minWidth:16,height:16,padding:"0 4px",boxSizing:"border-box",borderRadius:999,background:C.risk,color:C.white,border:`2px solid ${C.white}`,fontSize:9,fontWeight:900,lineHeight:"12px",display:"flex",alignItems:"center",justifyContent:"center",...F}}>{t.badge>99?"99+":t.badge}</div>}
        </div>
        <span style={{fontSize:9.5,fontWeight:on?900:600,color:on?"#0c8f3e":C.stone,...F}}>{t.label}</span>
      </button>
    );})}
  </div>
);
// ── AUTH ──
const LoginScreen=({onLogin,onRegister})=>{
  const [email,setEmail]=useState("");const [pass,setPass]=useState("");const [err,setErr]=useState("");const [show,setShow]=useState(false);
  const readiness=productionReadiness();
  const screenH=typeof window!=="undefined"?window.innerHeight:760;
  const tight=screenH<860, short=screenH<760;
  const loginLogoW=short?"min(43vw,188px)":tight?"min(44vw,212px)":"min(50vw,250px)";
  const loginLogoH=short?"clamp(66px,14vw,86px)":tight?"clamp(72px,16vw,100px)":"clamp(90px,19vw,122px)";
  const loginShift=short?88:tight?84:78;
  const sheetTop=short?276:tight?296:316;
  const demoAccounts=DEMO_ACCOUNTS.map((account)=>({...account,color:C[account.colorKey]||C.emerald}));
  const submit=async()=>{
    if(isProductionMode()&&!readiness.ready){setErr(`Üretim ayarları eksik: ${readiness.missing.join(", ")}.`);return;}
    let u=null;
    try{u=await authUser(email,pass);}catch(error){console.warn("login-error",error);}
    if(!u){setErr("E-posta veya şifre hatalı.");return;}
    if(u.status==="banned"){setErr("Bu hesap askıya alınmıştır.");return;}
    setErr("");onLogin(u);
  };
  return(
    <div style={{flex:1,height:"100dvh",overflow:"hidden",backgroundImage:"url('/login-wellness-bg.png')",backgroundSize:"cover",backgroundPosition:"center top",backgroundRepeat:"no-repeat",position:"relative"}}>
      <div style={{display:"none",position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
        <div style={{position:"absolute",left:-110,top:18,width:230,height:230,borderRadius:"50%",background:"radial-gradient(circle,#5fae3d 0%,rgba(95,174,61,.32) 38%,rgba(95,174,61,0) 68%)",filter:"blur(13px)",opacity:.58}}/>
        <div style={{position:"absolute",right:-88,top:42,width:300,height:520,borderRadius:"50%",background:"rgba(42,132,96,.08)",border:"1px solid rgba(42,132,96,.08)",transform:"rotate(16deg)"}}/>
        <div style={{position:"absolute",left:-90,bottom:118,width:260,height:360,borderRadius:"50% 50% 0 0",background:"linear-gradient(135deg,rgba(0,134,70,.8),rgba(166,223,149,.55))",transform:"rotate(-22deg)"}}/>
        <div style={{position:"absolute",left:-78,bottom:82,width:255,height:315,borderRadius:"50% 50% 0 0",background:"linear-gradient(135deg,rgba(224,248,221,.85),rgba(31,156,80,.2))",transform:"rotate(-22deg)"}}/>
        {[
          {l:24,t:520,s:58,r:-24,o:.72},{l:30,t:920,s:72,r:-22,o:.82},{l:112,t:646,s:54,r:32,o:.52},
          {r:22,t:76,s:58,rot:28,o:.78},{r:26,t:706,s:60,rot:-28,o:.75},{r:86,t:490,s:44,rot:20,o:.42}
        ].map((leaf,i)=><div key={i} style={{position:"absolute",left:leaf.l,top:leaf.t,right:leaf.r,width:leaf.s,height:leaf.s*1.8,borderRadius:"80% 0 80% 0",background:"linear-gradient(135deg,#8ee052,#0f7d37)",boxShadow:"0 12px 28px rgba(21,110,49,.18)",transform:`rotate(${leaf.r?leaf.rot:leaf.r||leaf.rot||0}deg)`,opacity:leaf.o}}/>)}
      </div>
      <div style={{position:"relative",zIndex:1,padding:`${short?6:tight?10:22}px 22px 0`,textAlign:"center",transform:`translateY(${loginShift}px)`}}>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",width:"100%"}}>
          <SWPMonogram width={loginLogoW} height={loginLogoH} flat variant="wide"/>
        </div>
        <div style={{marginTop:short?0:0,fontSize:short?27:tight?31:36,fontWeight:950,color:"#18282a",lineHeight:1,textShadow:"0 8px 18px rgba(255,255,255,.72)",...F}}>StepWise <span style={{color:"#61c91f"}}>Plus</span></div>
        <div style={{fontSize:short?13:tight?14:17,color:"#4d5b67",marginTop:short?5:6,fontWeight:800,whiteSpace:"nowrap",...F}}>Koç & Danışan Takip Sistemi</div>
        <div style={{width:short?78:110,height:2,borderRadius:999,background:"linear-gradient(90deg,transparent,rgba(40,166,77,.52),transparent)",margin:`${short?4:tight?6:12}px auto ${short?0:tight?2:6}px`}}/>
      </div>
      <div style={{position:"absolute",left:0,right:0,top:sheetTop,zIndex:2,padding:`0 ${tight?18:26}px max(10px, env(safe-area-inset-bottom))`,boxSizing:"border-box"}}>
        <div style={{background:"linear-gradient(180deg,rgba(255,255,255,.95),rgba(255,255,255,.9))",border:"1px solid rgba(255,255,255,.96)",borderRadius:tight?30:34,padding:`${short?18:tight?22:28}px ${tight?16:20}px ${short?14:tight?16:20}px`,boxShadow:"0 18px 52px rgba(41,110,73,.15)",backdropFilter:"blur(18px)",position:"relative",overflow:"hidden",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
        <div style={{position:"absolute",left:22,right:22,top:0,height:1,background:"linear-gradient(90deg,transparent,rgba(25,148,70,.35),transparent)"}}/>
        <div style={{textAlign:"center",marginBottom:short?8:tight?10:16}}>
          <div style={{fontSize:short?20:tight?23:28,fontWeight:950,color:"#0b2b1d",...F}}>Hoş Geldiniz!</div>
          <div style={{fontSize:short?12:tight?13:15,color:"#64748b",marginTop:short?3:5,...F}}>Lütfen hesabınıza giriş yapın</div>
        </div>
        {err&&<div style={{background:"#fde8e6",border:"1px solid #fca5a5",borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:12,color:C.risk,fontWeight:600,...F}}>{err}</div>}
        {[{label:"E-posta",val:email,set:setEmail,ph:"ornek@mail.com",icon:IC.mail},{label:"Şifre",val:pass,set:setPass,ph:"••••••••",type:show?"text":"password",icon:IC.lock}].map((f,i)=>(
          <div key={i} style={{marginBottom:short?7:tight?9:12}}>
            <div style={{display:"flex",alignItems:"center",gap:7,fontSize:short?12:14,fontWeight:900,color:"#172033",marginBottom:short?3:6,...F}}>
              <span style={{width:short?20:26,height:short?20:26,borderRadius:"50%",background:"#dff5e7",display:"flex",alignItems:"center",justifyContent:"center"}}><Ico d={f.icon} size={short?12:15} color="#159447" stroke={2}/></span>{f.label}
            </div>
            <div style={{position:"relative"}}>
              <input value={f.val} onChange={e=>f.set(e.target.value)} type={f.type||"text"} placeholder={f.ph}
                onKeyDown={e=>e.key==="Enter"&&submit()}
                style={{width:"100%",border:"1.5px solid #bfe8cd",borderRadius:short?16:19,padding:`${short?10:tight?12:14}px 44px ${short?10:tight?12:14}px 16px`,fontSize:short?15:16,outline:"none",boxSizing:"border-box",background:"#ffffff",color:"#07111f",boxShadow:"inset 0 1px 0 rgba(255,255,255,.9)",...F}}/>
              {i===1&&<button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",border:"none",background:"none",cursor:"pointer",padding:0}}><Ico d={IC.eye} size={16} color={C.stone}/></button>}
              {i===0&&<div style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)"}}><Ico d={IC.user} size={22} color="#149447" stroke={2}/></div>}
            </div>
          </div>
        ))}
        <button onClick={submit} style={{width:"100%",background:"linear-gradient(135deg,#00963b 0%,#0a8f3b 45%,#79d91f 100%)",border:"1px solid rgba(255,255,255,.55)",borderRadius:short?17:20,padding:short?11:tight?12:14,color:"#ffffff",fontSize:short?16:18,fontWeight:950,cursor:"pointer",boxShadow:"0 16px 30px rgba(20,147,61,.26)",marginTop:short?5:8,...F}}>Giriş Yap <span style={{fontSize:short?20:24,verticalAlign:-2,marginLeft:18}}>→</span></button>
        <div style={{textAlign:"center",fontSize:short?11.5:12.5,color:"#6b7b82",marginTop:short?8:10,...F}}>
          Hesabın yok mu?{" "}<button onClick={onRegister} style={{border:"none",background:"none",color:C.emerald,fontWeight:900,cursor:"pointer",fontSize:12,padding:0,...F}}>Kayıt Ol</button>
        </div>
        {isDemoAccountsEnabled()&&<div style={{marginTop:short?8:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {demoAccounts.map(a=><button key={a.email} onClick={()=>{setEmail(a.email);setPass(a.password);setErr("");}} style={{border:`1px solid ${C.mint}`,background:"rgba(255,255,255,.82)",borderRadius:12,padding:"7px 8px",textAlign:"left",cursor:"pointer",overflow:"hidden",...F}}>
            <div style={{fontSize:10,fontWeight:950,color:a.color,whiteSpace:"nowrap",...F}}>{a.role}</div>
            <div style={{fontSize:9.5,color:C.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",...F}}>{a.email}</div>
          </button>)}
        </div>}
        <div style={{height:1,background:"linear-gradient(90deg,transparent,rgba(17,143,65,.16),transparent)",margin:`${short?10:tight?12:16}px 0 ${short?8:tight?10:12}px`}}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:0,alignItems:"start"}}>
          {[
            {t:"Takip Et",s:"Hedeflerini izle",i:IC.activity},
            {t:"Planla",s:"Danışanlarını yönet",i:IC.users},
            {t:"Gelişimi İzle",s:"Sonuçları analiz et",i:IC.award}
          ].map((x,i)=><div key={x.t} style={{textAlign:"center",padding:"0 6px",borderLeft:i?`1px solid #dce7e1`:"none"}}>
            <div style={{width:short?34:tight?38:48,height:short?34:tight?38:48,borderRadius:"50%",background:"#e5f8ec",boxShadow:"0 10px 24px rgba(25,105,59,.14)",display:"flex",alignItems:"center",justifyContent:"center",margin:`0 auto ${short?5:tight?6:8}px`,border:"1px solid rgba(7,151,61,.22)"}}><Ico d={x.i} size={short?17:tight?18:21} color="#009f3d" stroke={2.6}/></div>
            <div style={{fontSize:short?11:tight?12:13,fontWeight:900,color:"#172033",lineHeight:1.08,...F}}>{x.t}</div>
            {!tight&&<div style={{fontSize:11,color:"#53636f",marginTop:4,lineHeight:1.2,...F}}>{x.s}</div>}
          </div>)}
        </div>
        </div>
        {false&&isDemoAccountsEnabled()&&<div style={{marginTop:14,display:"grid",gap:8}}>
          {demoAccounts.map(a=><button key={a.role} onClick={()=>{setEmail(a.email);setPass(a.password);setErr("");}} style={{width:"100%",border:`1.5px solid ${C.mint}`,background:C.white,borderRadius:13,padding:"10px 12px",display:"flex",alignItems:"center",gap:10,textAlign:"left",cursor:"pointer",...F}}>
            <span style={{minWidth:58,fontSize:11,fontWeight:900,color:a.color,...F}}>{a.role}</span>
            <span style={{flex:1,fontSize:11,color:C.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",...F}}>{a.email}</span>
            <span style={{fontSize:11,fontWeight:800,color:C.stone,...F}}>{a.password}</span>
          </button>)}
        </div>}
        {!readiness.ready&&<div style={{marginTop:24,background:isProductionMode()?"#fde8e6":C.foam,borderRadius:14,padding:"14px 16px",border:`1px solid ${isProductionMode()?"#fca5a5":C.mint}`,fontSize:12,color:isProductionMode()?C.risk:C.stone,lineHeight:1.5,...F}}>
          {isProductionMode()?"Üretim modu açık ama eksik servisler var: ":"Test modunda çalışıyor. Gerçek yayın için bağlanacak servisler: "}{readiness.missing.join(", ")}.
        </div>}
        {isDemoAccountsEnabled()&&<div style={{marginTop:24,background:C.foam,borderRadius:14,padding:"14px 16px",border:`1px solid ${C.mint}`,fontSize:12,color:C.stone,lineHeight:1.5,...F}}>
          Test sürecinde yukarıdaki kayıtlı hesaplarla admin, koç ve danışan ekranlarını hızlıca kontrol edebilirsin.
        </div>}
      </div>
    </div>
  );
};

const RegisterScreen=({onBack,onDone})=>{
  const [step,setStep]=useState(1);const [role,setRole]=useState("");
  const [form,setForm]=useState({name:"",email:"",password:"",refCode:"",clientCode:""});const [err,setErr]=useState("");
  const matchedCoach=role==="client"&&form.refCode.trim()?DB.users().find(u=>u.role==="coach"&&u.refCode===form.refCode.trim().toUpperCase()):null;
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=async()=>{
    const users=DB.users();
    if(isProductionMode()){
      const validation=validateRegistrationBase({role,form,users});
      if(!validation.ok){setErr(validation.error);return;}
      try{
        const created=await registerAccount(registrationPayload({role,form}));
        if(created?.pendingEmailConfirmation){setErr("E-posta doğrulaması gerekli. Mail kutunu kontrol et, sonra giriş yap.");return;}
        if(!created){setErr("Kayıt tamamlanamadı.");return;}
        onDone(created);
      }catch(error){
        setErr("Kayıt reddedildi: kod geçersiz, kullanılmış veya e-posta zaten kayıtlı olabilir.");
      }
      return;
    }
    const validation=validateRegistration({role,form,users,coachCodes:DB.coachCodes()});
    if(!validation.ok){setErr(validation.error);return;}
    const isoTime=new Date().toISOString();
    const date=todayKey();
    if(role==="coach"){
      const {clean,refCode,activationCode}=validation;
      const nc=await withPassword(buildLocalCoachRegistration({clean,refCode,date,isoTime}),clean.password);
      DB.setCoachCodes(DB.coachCodes().map(c=>c.code===activationCode?{...c,status:"used",usedBy:nc.id,usedAt:date}:c));
      DB.setUsers([...users,nc]);onDone(nc);
    } else {
      const {clean,coach}=validation;
      const nc=await withPassword(buildLocalClientRegistration({clean,coach,date,isoTime}),clean.password);
      DB.setUsers([...users.map(u=>u.id===coach.id?{...u,clients:[...(u.clients||[]),nc.id]}:u),nc]);
      onDone(nc);
    }
  };
  if(step===1) return(
    <div style={{flex:1,overflowY:"auto",background:C.mist,padding:"24px"}}>
      <button onClick={onBack} style={{border:"none",background:C.foam,width:36,height:36,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:24}}><Ico d={IC.back} size={16} color={C.emerald}/></button>
      <div style={{fontSize:24,fontWeight:800,color:C.ink,marginBottom:8,...F}}>Kayıt Ol</div>
      <div style={{fontSize:14,color:C.stone,marginBottom:32,...F}}>Hesap türünü seç</div>
      {[{r:"coach",icon:"🏋️",title:"Koç",desc:"Danışanlarını yönet ve program oluştur",note:"Aktivasyon kodu gerekli"},
        {r:"client",icon:"🌿",title:"Danışan",desc:"Koçuna bağlan, görevlerini takip et",note:"Koç referans kodu gerekli"}].map(o=>(
        <div key={o.r} onClick={()=>{setRole(o.r);setStep(2);}} style={{background:C.white,borderRadius:20,padding:"20px",border:`2px solid ${C.mint}`,cursor:"pointer",boxShadow:"0 2px 12px rgba(13,61,43,.06)",marginBottom:12}}>
          <div style={{fontSize:32,marginBottom:8}}>{o.icon}</div>
          <div style={{fontSize:18,fontWeight:800,color:C.ink,marginBottom:4,...F}}>{o.title}</div>
          <div style={{fontSize:13,color:C.stone,marginBottom:10,...F}}>{o.desc}</div>
          <Pill bg={C.foam} color={C.stone}>{o.note}</Pill>
        </div>
      ))}
    </div>
  );
  return(
    <div style={{flex:1,overflowY:"auto",background:C.mist,padding:"24px"}}>
      <button onClick={()=>setStep(1)} style={{border:"none",background:C.foam,width:36,height:36,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:24}}><Ico d={IC.back} size={16} color={C.emerald}/></button>
      <div style={{fontSize:22,fontWeight:800,color:C.ink,marginBottom:4,...F}}>{role==="coach"?"Koç Kaydı":"Danışan Kaydı"}</div>
      <div style={{fontSize:13,color:C.stone,marginBottom:24,...F}}>{role==="coach"?"Sistem yöneticisinden aktivasyon kodunu al":"Koçundan referans kodunu al"}</div>
      {err&&<div style={{background:"#fde8e6",borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:12,color:C.risk,fontWeight:600,...F}}>{err}</div>}
      {[{k:"name",l:"Ad Soyad",ph:"Adın ve soyadın"},{k:"email",l:"E-posta",ph:"ornek@mail.com",t:"email"},
        {k:"password",l:"Şifre",ph:"En az 6 karakter",t:"password"},
        {k:"refCode",l:role==="coach"?"Koç Aktivasyon Kodu":"Koç Referans Kodu",ph:role==="coach"?"COACH-MASTER-2026":"UM-UT2026"},
        ...(role==="coach"?[{k:"clientCode",l:"Danışan Kayıt Kodun",ph:"Boş bırakırsan otomatik oluşur"}]:[])].map(f=>(
        <div key={f.k} style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:C.ink,marginBottom:6,...F}}>{f.l}</div>
          <input value={form[f.k]} onChange={e=>upd(f.k,["refCode","clientCode"].includes(f.k)?e.target.value.toUpperCase():e.target.value)} type={f.t||"text"} placeholder={f.ph}
            style={controlStyle({borderRadius:14,padding:"12px 16px",fontSize:14})}/>
        </div>
      ))}
      {role==="client"&&form.refCode.trim()&&<div style={{background:matchedCoach?C.mint:"#fde8e6",border:`1px solid ${matchedCoach?C.jade:"#f7b4ac"}`,borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:12,color:matchedCoach?C.emerald:C.risk,fontWeight:800,...F}}>{matchedCoach?`Bağlanacağın koç: ${matchedCoach.name}`:"Bu koda ait koç bulunamadı."}</div>}
      {role==="coach"&&<div style={{background:"#fff8ec",border:"1px solid #ffe0a0",borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#a07000",...F}}><b>Test kodu:</b> Admin panelinden üretilen aktif kodlardan biri kullanılır.</div>}
      <button onClick={submit} style={buttonStyle({style:{width:"100%",borderRadius:16,padding:"15px",fontSize:15,boxShadow:`0 6px 20px rgba(26,102,69,.3)`}})}>Kaydı Tamamla</button>
    </div>
  );
};
// ── COACH SCREENS ──
const CoachHome=({user,onNav,allUsers})=>{
  const anim=useAnim(user.id);
  const [,forceHomeUpdate]=useState(0);
  const [previewProof,setPreviewProof]=useState(null);
  const liveUsers=DB.users();
  const {clients,avg,activeTasks,proofActions,photoPending,riskClients}=getCoachDashboardSummary({
    coach:user,
    users:liveUsers,
    hasAssignedProgram,
    currentPendingCount,
    coachProofActions,
    isRiskClient,
  });
  const handleProof=(p,status)=>{updateCoachProofStatus(user.id,p.client.id,p.idx,status);forceHomeUpdate(n=>n+1);};
  const openSummaryCard=(kind)=>{
    if(kind==="photo"&&proofActions[0]){setPreviewProof(proofActions[0]);return;}
    if(kind==="risk"||kind==="clients"){onNav?.("clients");return;}
    onNav?.("reports");
  };
  return(
    <div style={{flex:1,overflowY:"auto",background:C.mist}}>
      {previewProof&&<ImageLightbox media={previewProof} title={previewProof.client?.name||"Fotoğraf kanıtı"} subtitle={`${previewProof.task||"Görev"} · ${previewProof.time||""} · onay bekliyor${previewProof.note?` · Not: ${previewProof.note}`:""}`} onClose={()=>setPreviewProof(null)}/>}
      <div style={{padding:"18px 18px 12px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-90,top:-120,width:270,height:270,borderRadius:"50%",background:"radial-gradient(circle,rgba(126,218,38,.22),rgba(255,255,255,0) 62%)",pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,position:"relative"}}>
          <div style={{width:72,height:48,borderRadius:0,background:"transparent",boxShadow:"none",border:"none",display:"flex",alignItems:"center",justifyContent:"center",overflow:"visible"}}>
            <SWPMonogram width={64} height={38} flat variant="wide"/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,color:"#667985",fontWeight:800,...F}}>Merhaba, Koç</div>
            <div style={{fontSize:22,fontWeight:950,color:"#14252b",lineHeight:1.1,...F}}>{user.name}</div>
          </div>
          <Avatar user={user} size={64} bg="#e9faef" fg={C.emerald}/>
        </div>
        <div style={{background:"linear-gradient(135deg,rgba(8,55,40,.97),rgba(0,105,63,.9) 58%,rgba(114,212,29,.82))",borderRadius:24,padding:"20px 20px 18px",boxShadow:"0 22px 45px rgba(11,92,55,.24)",border:"1px solid rgba(255,255,255,.18)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-34,bottom:-42,width:150,height:150,borderRadius:"50%",border:"1px solid rgba(255,255,255,.16)"}}/>
          <div style={{fontSize:11,color:"rgba(255,255,255,.75)",fontWeight:900,letterSpacing:.8,marginBottom:10,...F}}>BUGÜNÜN TAKİBİ</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:14}}>
            <div><div style={{fontSize:42,fontWeight:950,color:C.white,lineHeight:1,...F}}>{Math.round(anim*avg)}%</div><div style={{fontSize:12,color:"rgba(255,255,255,.72)",fontWeight:700,...F}}>Ortalama uyum</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:34,fontWeight:950,color:"#c7ff5c",lineHeight:1,...F}}>{activeTasks}</div><div style={{fontSize:12,color:"rgba(255,255,255,.72)",fontWeight:700,...F}}>Aktif görev</div></div>
          </div>
          <div style={{height:8,background:"rgba(255,255,255,.18)",borderRadius:999,overflow:"hidden"}}>
            <div style={{width:`${anim*avg}%`,height:"100%",background:"linear-gradient(90deg,#ffffff,#c8ff55)",borderRadius:999,transition:"width .05s"}}/>
          </div>
        </div>
      </div>
      <div style={{padding:"16px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {[{l:"Aktif Danışan",v:clients.length,c:"#009f3d",i:IC.clients,kind:"clients"},{l:"Fotoğraf",v:photoPending,c:"#e8a020",i:IC.cam,kind:"photo"},
            {l:"Riskli",v:riskClients.length,c:C.risk,i:IC.warn,kind:"risk"}].map((s,i)=>(
            <Card key={i} onClick={()=>openSummaryCard(s.kind)} style={{padding:"15px 16px",background:"rgba(255,255,255,.86)",border:"1px solid rgba(255,255,255,.9)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                <div><div style={{fontSize:10,color:"#6d7f86",fontWeight:800,marginBottom:4,...F}}>{s.l}</div>
                <div style={{fontSize:24,fontWeight:950,color:s.c,lineHeight:1,...F}}>{s.v}</div></div>
                <div style={{width:34,height:34,borderRadius:13,background:"#e8f8ed",display:"flex",alignItems:"center",justifyContent:"center"}}><Ico d={s.i} size={17} color={s.c} stroke={2.4}/></div>
              </div>
            </Card>
          ))}
        </div>
        {proofActions.length>0&&(
          <Card style={{padding:"14px 14px 10px",marginBottom:16,border:`1.5px solid rgba(232,160,32,.28)`,background:"rgba(255,252,244,.96)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:9,minWidth:0}}>
                <div style={{width:34,height:34,borderRadius:13,background:"#fff4e0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ico d={IC.cam} size={17} color={C.warn}/></div>
                <div style={{minWidth:0}}><div style={{fontSize:14,fontWeight:900,color:C.ink,...F}}>Onay Bekleyen Fotoğraflar</div><div style={{fontSize:11,color:C.stone,...F}}>{proofActions.length} yeni danışan bildirimi</div></div>
              </div>
            </div>
            {proofActions.slice(0,4).map((p,i)=>(
              <div key={`${p.client.id}-${p.idx}-${p.id||i}`} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderTop:i?`1px solid rgba(232,160,32,.18)`:"none"}}>
                {hasMediaImage(p)?<button onClick={()=>setPreviewProof(p)} style={{border:"none",background:"transparent",padding:0,width:48,height:48,borderRadius:14,overflow:"hidden",flexShrink:0,cursor:"pointer",boxShadow:"0 8px 18px rgba(13,61,43,.14)"}}><MediaImage media={p} alt="Fotoğraf kanıtı" style={{width:"100%",height:"100%",objectFit:"cover",display:"block",border:`1px solid ${C.mint}`}}/></button>:<Av ini={ini(p.client.name)} size={44}/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:900,color:C.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",...F}}>{p.client.name}</div>
                  <div style={{fontSize:11,color:C.stone,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",...F}}>{p.task} · {p.time||"şimdi"}</div>
                  {p.note&&<div style={{fontSize:11,color:C.emerald,background:C.mint,borderRadius:9,padding:"5px 7px",marginTop:6,lineHeight:1.25,...F}}>Not: {p.note}</div>}
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <button onClick={()=>handleProof(p,"approved")} style={{border:"none",background:C.mint,color:C.emerald,borderRadius:10,padding:"8px 9px",fontSize:10,fontWeight:900,...F}}>Onay</button>
                  <button onClick={()=>handleProof(p,"dismissed")} style={{border:"none",background:C.foam,color:C.stone,borderRadius:10,padding:"8px 9px",fontSize:10,fontWeight:900,...F}}>Kapat</button>
                </div>
              </div>
            ))}
            {proofActions.length>4&&<div style={{fontSize:11,color:C.stone,paddingTop:6,...F}}>+{proofActions.length-4} bildirim daha var.</div>}
          </Card>
        )}
        {riskClients.length>0&&(
          <Card style={{padding:"14px 16px",marginBottom:16,border:`1.5px solid #ffd4d0`,background:"#fff8f7"}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{width:36,height:36,borderRadius:12,background:"#fde8e6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ico d={IC.warn} size={18} color={C.risk}/></div>
              <div onClick={()=>onNav?.("clients")} style={{cursor:"pointer"}}><div style={{fontSize:13,fontWeight:700,color:C.risk,...F}}>Riskli Danışan</div>
              <div style={{fontSize:12,color:"#b85c52",...F}}>{riskClients.map(c=>c.name).join(", ")}</div></div>
            </div>
          </Card>
        )}
                <div style={{height:16}}/>
      </div>
    </div>
  );
};

const CoachClients=({user,allUsers,onUpdate})=>{
  const [q,setQ]=useState("");const [tab,setTab]=useState("Tümü");
  const [adding,setAdding]=useState(false);const [selected,setSelected]=useState(null);const [programTarget,setProgramTarget]=useState(null);
  const [programEdit,setProgramEdit]=useState(null);const [bodyEdit,setBodyEdit]=useState(null);
  const [form,setForm]=useState({name:"",email:"",phone:"",goal:"",programStartDate:todayKey(),programEndDate:"",password:"client123"});
  const [err,setErr]=useState("");
  useBackClose(adding,()=>setAdding(false));
  const clients=allUsers.filter(u=>u.role==="client"&&u.coachId===user.id);
  const banned=clients.filter(c=>c.status==="banned");
  const fil=clients.filter(c=>{
    const mq=c.name.toLowerCase().includes(q.toLowerCase())||c.email.toLowerCase().includes(q.toLowerCase())||(c.goal||"").toLowerCase().includes(q.toLowerCase());
    const mt=tab==="Tümü"||(tab==="Aktif"&&c.status==="active")||(tab==="Riskli"&&isRiskClient(c))||(tab==="Yasaklı"&&c.status==="banned");
    return mq&&mt;
  });
  const refresh=()=>onUpdate?.();
  const createClient=async()=>{
    if(!form.name.trim()||!form.email.trim()){setErr("Ad soyad ve e-posta zorunlu.");return;}
    if((form.password||"").length<6){setErr("Geçici şifre en az 6 karakter olmalı.");return;}
    const users=DB.users();
    if(users.some(u=>u.email.toLowerCase()===form.email.trim().toLowerCase())){setErr("Bu e-posta zaten kayıtlı.");return;}
    if(isProductionMode()&&user.supabaseToken){
      try{
        const created=await coachCreateClient({name:form.name.trim(),email:form.email.trim().toLowerCase(),password:form.password||"client123"},user.supabaseToken);
        const id=created?.id||"client"+Date.now();
        const createdAtTime=new Date().toISOString();
        const nc=buildNewClientProfile({id,form,coach:user,createdAt:todayKey(),createdAtTime});
        DB.setUsers([...attachClientToCoach(users,user.id,id),nc]);
        setForm({name:"",email:"",phone:"",goal:"",programStartDate:todayKey(),programEndDate:"",password:"client123"});setErr("");setAdding(false);refresh();
      }catch(error){
        console.warn("cloud-client-create-fallback",error);
        const id="client"+Date.now();
        const createdAtTime=new Date().toISOString();
        const nc=await withPassword(buildNewClientProfile({id,form,coach:user,createdAt:todayKey(),createdAtTime}),form.password||"client123");
        DB.setUsers([...attachClientToCoach(users,user.id,id),nc]);
        setForm({name:"",email:"",phone:"",goal:"",programStartDate:todayKey(),programEndDate:"",password:"client123"});setErr("");setAdding(false);refresh();
      }
      return;
    }
    const id="client"+Date.now();
    const createdAtTime=new Date().toISOString();
    const nc=await withPassword(buildNewClientProfile({id,form,coach:user,createdAt:todayKey(),createdAtTime}),form.password||"client123");
    DB.setUsers([...attachClientToCoach(users,user.id,id),nc]);
    setForm({name:"",email:"",phone:"",goal:"",programStartDate:todayKey(),programEndDate:"",password:"client123"});setErr("");setAdding(false);refresh();
  };
  const toggleBan=async(client)=>{const nextStatus=client.status==="banned"?"active":"banned";if(isProductionMode()&&user.supabaseToken){try{await saveProfilePatch(client.id,{status:nextStatus},user.supabaseToken);}catch(err){console.warn("cloud-client-status",err);}}DB.setUsers(DB.users().map(u=>u.id===client.id?{...u,status:nextStatus}:u));setSelected(null);refresh();};
  const assignProgram=async(client,template)=>{
    let cloudTemplate=template;
    if(isProductionMode()&&user.supabaseToken){
      try{
        const result=await assignCloudProgram({client,coach:user,template,startDate:client.programStartDate||todayKey(),endDate:client.programEndDate||""},user.supabaseToken);
        cloudTemplate=result.program||template;
      }catch(err){console.warn("cloud-program-assign",err);}
    }
    template={...template,id:cloudTemplate.id||template.id};
    const programVideo=programVideoForAssignment(template);
    const activeTasks=normalizeProgramTasksForCycle(template.tasks||[]).filter(t=>isTaskActiveToday(t,client));
    let updatedClient=null;
    DB.setUsers(DB.users().map(u=>{
      if(u.id!==client.id)return u;
      updatedClient=buildAssignedProgramClient({client:u,template,activeTasks,productVideo:programVideo,date:todayKey(),historyLimit:5});
      return updatedClient;
    }));
    setProgramTarget(null);setSelected(updatedClient);refresh();
  };
  const Metric=({l,v,c=C.ink})=><div style={{flex:1,background:C.foam,borderRadius:10,padding:"8px 0",textAlign:"center"}}><div style={{fontSize:15,fontWeight:800,color:c,...F}}>{v}</div><div style={{fontSize:10,color:C.stone,...F}}>{l}</div></div>;
  const TaskLine=({task,i})=>{const ms=measuresOf(task.note);return <div style={{display:"flex",alignItems:"center",gap:10,background:C.foam,borderRadius:12,padding:"10px",marginBottom:8}}><div style={{width:30,height:30,borderRadius:10,background:task.photoRequired?C.blueBg:C.mint,display:"flex",alignItems:"center",justifyContent:"center"}}><Ico d={task.photoRequired?IC.cam:IC.check} size={15} color={task.photoRequired?C.blue:C.emerald}/></div><div style={{flex:1}}><div style={{fontSize:12,fontWeight:800,color:C.ink,...F}}>{task.title||task}</div><div style={{fontSize:10,color:C.stone,...F}}>{task.section||"Genel"} · {task.scheduledTime||"-"} · {task.repeatType||"daily"}{task.snoozeEnabled?" · erteleme":""}</div>{ms.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:5}}>{ms.map(m=><Pill key={m} bg={C.white} color={C.emerald}>{m}</Pill>)}</div>}{task.note&&<div style={{fontSize:10,color:C.emerald,marginTop:3,lineHeight:1.35,...F}}>{task.note}</div>}</div>{task.photoRequired&&<Pill bg={C.blueBg} color={C.blue}>Foto</Pill>}</div>};
  const BodyEditor=({client,onClose})=>{
    useBackClose(true,onClose);
    const [b,setB]=useState(normalizeBody({...bodyDefaults,height:170,age:30,...(client.body||{})}));
    const est=estimateBody({height:b.height,weight:b.current||b.start,age:b.age,gender:b.gender});
    const setNum=(k,v)=>setB(x=>({...x,[k]:v===""?"":Number(v)}));
    const applyEstimate=()=>setB(x=>applyBodyEstimateToDraft(x,est));
    const save=async()=>{const body=normalizeBody(b);if(isProductionMode()&&user.supabaseToken){try{await createCloudBodyMetric({clientId:client.id,coachId:user.id,body,note:"Koç vücut analizi güncelledi"},user.supabaseToken);}catch(err){console.warn("cloud-body",err);}}DB.setUsers(DB.users().map(u=>u.id===client.id?{...u,body}:u));setBodyEdit(null);setSelected(null);refresh();};
    return <div style={{position:"absolute",inset:0,background:"rgba(10,31,22,.72)",zIndex:90,display:"flex",alignItems:"flex-end"}}><div style={{background:C.white,borderRadius:"24px 24px 0 0",padding:"20px",width:"100%",maxHeight:"88%",overflowY:"auto",boxSizing:"border-box"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div><div style={{fontSize:18,fontWeight:800,color:C.ink,...F}}>Vücut Analizi</div><div style={{fontSize:12,color:C.stone,...F}}>{client.name}</div></div><button onClick={onClose} style={{border:"none",background:C.foam,borderRadius:12,padding:"8px 12px",color:C.stone,...F}}>Kapat</button></div>
      <Card style={{padding:"12px",marginBottom:12,background:C.foam,border:"none"}}><div style={{fontSize:13,fontWeight:800,color:C.ink,marginBottom:8,...F}}>Otomatik Tahmin</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[["height","Boy cm"],["age","Yaş"],["current","Kilo kg"]].map(([k,l])=><div key={k}><div style={{fontSize:10,fontWeight:800,color:C.ink,marginBottom:4,...F}}>{l}</div><input type="number" value={b[k]??""} onChange={e=>setNum(k,e.target.value)} style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${C.mint}`,borderRadius:12,padding:"10px",fontSize:12,outline:"none",color:C.ink,...F}}/></div>)}</div><select value={b.gender||"female"} onChange={e=>setB(x=>({...x,gender:e.target.value}))} style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${C.mint}`,borderRadius:12,padding:"10px",fontSize:12,outline:"none",color:C.ink,marginTop:8,...F}}><option value="female">Kadın</option><option value="male">Erkek</option></select><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}>{[{l:"Tahmini yağ",v:`%${est.fat||0}`},{l:"Fazla kilo",v:`${est.excess||0} kg`},{l:"BMI",v:est.bmi||0},{l:"İdeal",v:est.ideal}].map(x=><div key={x.l} style={{background:C.white,borderRadius:12,padding:"9px"}}><div style={{fontSize:10,color:C.stone,...F}}>{x.l}</div><div style={{fontSize:14,fontWeight:800,color:C.ink,...F}}>{x.v}</div></div>)}</div><button onClick={applyEstimate} style={{width:"100%",border:"none",background:C.emerald,color:C.white,borderRadius:13,padding:"11px",fontWeight:800,marginTop:10,...F}}>Tahmini Değerleri Uygula</button></Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[["start","Başlangıç kg"],["target","Hedef kg"],["bmi","BMI"],["water","Su %"],["fat","Yağ %"],["muscle","Kas %"],["waist","Bel cm"],["hip","Kalça cm"],["chest","Göğüs cm"],["excess","Tahmini fazla kg"]].map(([k,l])=><div key={k}><div style={{fontSize:10,fontWeight:800,color:C.ink,marginBottom:4,...F}}>{l}</div><input type="number" value={b[k]??""} onChange={e=>setNum(k,e.target.value)} style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${C.mint}`,borderRadius:12,padding:"10px",fontSize:12,outline:"none",color:C.ink,...F}}/></div>)}</div><div style={{fontSize:10,fontWeight:800,color:C.ink,margin:"10px 0 4px",...F}}>İdeal aralık</div><input value={b.ideal||""} onChange={e=>setB(x=>({...x,ideal:e.target.value}))} style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${C.mint}`,borderRadius:12,padding:"10px",fontSize:12,outline:"none",color:C.ink,...F}}/><button onClick={save} style={{width:"100%",border:"none",background:C.emerald,color:C.white,borderRadius:15,padding:"13px",fontWeight:800,marginTop:12,...F}}>Analizi Kaydet</button></div></div>;
  };
  const ProgramEditor=({client,onClose})=>{useBackClose(true,onClose);const initial=client.programDraft||getTemplateByClient(client);const [draft,setDraft]=useState({name:initial.name,desc:initial.desc||"",duration:initial.duration||"",bannedFoods:[...(initial.bannedFoods||BANNED_FOODS)],tasks:[...(initial.tasks||[])]});const [analysis,setAnalysis]=useState({height:client.body?.height||170,weight:client.body?.current||client.body?.start||70,age:client.body?.age||30,gender:client.body?.gender||"female"});const est=estimateBody(analysis);const updateTask=(idx,key,val)=>setDraft(d=>({...d,tasks:d.tasks.map((t,i)=>i===idx?{...t,[key]:val}:t)}));const addTask=()=>setDraft(d=>({...d,tasks:[...d.tasks,{title:"Yeni görev",type:"meal",section:"Öğün",scheduledTime:"09:00",repeatType:"daily",buttonLabel:"Tamamlandı",photoRequired:true,snoozeEnabled:true,snoozeOptions:[15,30]}]}));const moveTask=(idx,dir)=>setDraft(d=>{const tasks=[...d.tasks],to=idx+dir;if(to<0||to>=tasks.length)return d;[tasks[idx],tasks[to]]=[tasks[to],tasks[idx]];return {...d,tasks};});const duplicateTask=(idx)=>setDraft(d=>({...d,tasks:[...d.tasks.slice(0,idx+1),{...d.tasks[idx],title:(d.tasks[idx].title||"Görev")+" kopya"},...d.tasks.slice(idx+1)]}));const save=()=>{const lockedDraft={...draft,tasks:draft.tasks.map(t=>({...t,photoRequired:true}))};const body={...(client.body||{}),height:Number(analysis.height)||0,current:Number(analysis.weight)||client.body?.current||0,age:Number(analysis.age)||0,gender:analysis.gender,bmi:est.bmi,fat:est.fat,water:est.water,muscle:est.muscle,target:est.target||client.body?.target,ideal:est.ideal,excess:est.excess};const history=[{name:lockedDraft.name,date:new Date().toISOString().split("T")[0],duration:lockedDraft.duration,tasks:lockedDraft.tasks,bannedFoods:lockedDraft.bannedFoods,bodyAnalysis:body},...(client.programHistory||[])].slice(0,8);DB.setUsers(DB.users().map(u=>u.id===client.id?{...u,body,program:lockedDraft.name,programDraft:lockedDraft,tasks:lockedDraft.tasks.map((_,i)=>u.tasks?.[i]||false),pendingToday:lockedDraft.tasks.length,photoPendingToday:lockedDraft.tasks.filter(t=>t.photoRequired).length,programHistory:history}:u));setProgramEdit(null);setSelected(null);refresh();};return <div style={{position:"absolute",inset:0,background:"rgba(10,31,22,.72)",zIndex:91,display:"flex",alignItems:"flex-end",overflow:"hidden"}}><div style={{background:C.white,borderRadius:"24px 24px 0 0",padding:"20px",width:"100%",maxWidth:"100vw",maxHeight:"90%",overflowY:"auto",overflowX:"hidden",boxSizing:"border-box"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{minWidth:0}}><div style={{fontSize:18,fontWeight:800,color:C.ink,...F}}>Program Düzenle</div><div style={{fontSize:12,color:C.stone,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",...F}}>{client.name}</div></div><button onClick={onClose} style={{border:"none",background:C.foam,borderRadius:12,padding:"8px 12px",color:C.stone,flexShrink:0,...F}}>Kapat</button></div>{[["name","Program adı"],["desc","Açıklama"],["duration","Süre"]].map(([k,l])=><div key={k} style={{marginBottom:8}}><div style={{fontSize:10,fontWeight:800,color:C.ink,marginBottom:4,...F}}>{l}</div><input value={draft[k]} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))} style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${C.mint}`,borderRadius:12,padding:"10px",fontSize:12,outline:"none",color:C.ink,...F}}/></div>)}<Card style={{padding:"12px",margin:"10px 0 12px",background:C.foam,border:"none"}}><div style={{fontSize:13,fontWeight:800,color:C.ink,marginBottom:8,...F}}>Ekstra Vücut Analizi</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[["height","Boy cm"],["weight","Kilo kg"],["age","Yaş"]].map(([k,l])=><div key={k}><div style={{fontSize:10,fontWeight:800,color:C.ink,marginBottom:4,...F}}>{l}</div><input type="number" value={analysis[k]} onChange={e=>setAnalysis(a=>({...a,[k]:e.target.value}))} style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${C.mint}`,borderRadius:12,padding:"10px",fontSize:12,outline:"none",color:C.ink,...F}}/></div>)}</div><select value={analysis.gender} onChange={e=>setAnalysis(a=>({...a,gender:e.target.value}))} style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${C.mint}`,borderRadius:12,padding:"10px",fontSize:12,outline:"none",color:C.ink,marginTop:8,...F}}><option value="female">Kadın</option><option value="male">Erkek</option></select><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}>{[{l:"Tahmini yağ",v:`%${est.fat||0}`},{l:"Tahmini fazla kilo",v:`${est.excess||0} kg`},{l:"BMI",v:est.bmi||0},{l:"İdeal aralık",v:est.ideal}].map(x=><div key={x.l} style={{background:C.white,borderRadius:12,padding:"9px"}}><div style={{fontSize:10,color:C.stone,...F}}>{x.l}</div><div style={{fontSize:13,fontWeight:800,color:C.ink,...F}}>{x.v}</div></div>)}</div></Card><div style={{fontSize:13,fontWeight:800,color:C.ink,margin:"10px 0 6px",...F}}>Kayıtlı Yasaklı Liste</div><textarea value={draft.bannedFoods.join(", ")} onChange={e=>setDraft(d=>({...d,bannedFoods:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)}))} style={{width:"100%",boxSizing:"border-box",minHeight:68,border:`1.5px solid ${C.mint}`,borderRadius:12,padding:10,fontSize:12,outline:"none",color:C.ink,...F}}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"14px 0 8px"}}><div style={{fontSize:13,fontWeight:800,color:C.ink,...F}}>Görev Bölümleri</div><button onClick={addTask} style={{border:"none",background:C.mint,color:C.emerald,borderRadius:12,padding:"8px 10px",fontWeight:800,fontSize:11,flexShrink:0,...F}}>+ Görev</button></div>{draft.tasks.map((t,i)=><Card key={i} style={{padding:"12px",marginBottom:8}}><div style={{display:"grid",gridTemplateColumns:"1fr 90px",gap:8}}><input value={t.title} onChange={e=>updateTask(i,"title",e.target.value)} style={{border:`1.5px solid ${C.mint}`,borderRadius:10,padding:9,fontSize:12,...F}}/><input value={t.scheduledTime} onChange={e=>updateTask(i,"scheduledTime",e.target.value)} style={{border:`1.5px solid ${C.mint}`,borderRadius:10,padding:9,fontSize:12,...F}}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><input value={t.section||""} onChange={e=>updateTask(i,"section",e.target.value)} style={{border:`1.5px solid ${C.mint}`,borderRadius:10,padding:9,fontSize:12,...F}}/><input value={t.type||""} onChange={e=>updateTask(i,"type",e.target.value)} style={{border:`1.5px solid ${C.mint}`,borderRadius:10,padding:9,fontSize:12,...F}}/></div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:6,marginTop:8,flexWrap:"wrap"}}><label style={{fontSize:11,fontWeight:800,color:C.ink,...F}}><input type="checkbox" checked={!!t.snoozeEnabled} onChange={e=>updateTask(i,"snoozeEnabled",e.target.checked)}/> Erteleme</label><button onClick={()=>moveTask(i,-1)} disabled={i===0} style={{border:"none",background:C.foam,color:i===0?C.stone:C.emerald,borderRadius:10,padding:"7px 8px",fontSize:11,fontWeight:800,...F}}>↑</button><button onClick={()=>moveTask(i,1)} disabled={i===draft.tasks.length-1} style={{border:"none",background:C.foam,color:i===draft.tasks.length-1?C.stone:C.emerald,borderRadius:10,padding:"7px 8px",fontSize:11,fontWeight:800,...F}}>↓</button><button onClick={()=>duplicateTask(i)} style={{border:"none",background:C.blueBg,color:C.blue,borderRadius:10,padding:"7px 9px",fontSize:11,fontWeight:800,...F}}>Kopya</button><button onClick={()=>setDraft(d=>({...d,tasks:d.tasks.filter((_,x)=>x!==i)}))} style={{border:"none",background:"#fde8e6",color:C.risk,borderRadius:10,padding:"7px 10px",fontSize:11,fontWeight:800,...F}}>Sil</button></div></Card>)}<button onClick={save} style={{width:"100%",border:"none",background:C.emerald,color:C.white,borderRadius:15,padding:"13px",fontWeight:800,marginTop:8,...F}}>Programı Kaydet</button></div></div>};
  const ProgramPicker=({client,onClose})=>{
    useBackClose(true,onClose);
    return (
    <div style={{position:"absolute",inset:0,background:"rgba(10,31,22,.72)",zIndex:80,display:"flex",alignItems:"flex-end",overflow:"hidden"}}>
      <div style={{background:C.white,borderRadius:"24px 24px 0 0",padding:"20px",width:"100%",maxWidth:"100vw",maxHeight:"82%",overflowY:"auto",overflowX:"hidden",boxSizing:"border-box"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div><div style={{fontSize:18,fontWeight:800,color:C.ink,...F}}>Program Ata</div><div style={{fontSize:12,color:C.stone,...F}}>{client.name}</div></div><button onClick={onClose} style={{border:"none",background:C.foam,borderRadius:12,padding:"8px 12px",color:C.stone,...F}}>Kapat</button></div>
        {allPrograms(user.id).map(t=><Card key={t.id} style={{padding:"14px",marginBottom:10}} onClick={()=>assignProgram(client,t)}>
          <div style={{display:"flex",justifyContent:"space-between",gap:10,marginBottom:6}}><div style={{fontSize:15,fontWeight:800,color:C.ink,...F}}>{t.name}</div><Pill bg={C.mint}>{t.duration}</Pill></div>
          <div style={{fontSize:12,color:C.stone,marginBottom:10,...F}}>{t.desc}</div>{t.productVideo&&<div style={{marginBottom:8}}><Pill bg={C.blueBg} color={C.blue}>Video programla beraber gidecek</Pill></div>}
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{t.tasks.map(task=><Pill key={task.title||task} bg={C.foam} color={C.stone}>{task.title||task}</Pill>)}</div>
        </Card>)}
      </div>
    </div>
  );};
  const DetailSheet=({client,onClose})=>{
    useBackClose(true,onClose);
    const videoRef=useRef(null);
    const [dates,setDates]=useState({programStartDate:client.programStartDate||client.startedAt||client.createdAt||todayKey(),programEndDate:client.programEndDate||""});
    const saveDates=async()=>{let updated={...client,programStartDate:dates.programStartDate,programEndDate:dates.programEndDate,startedAt:dates.programStartDate||client.startedAt};if(isProductionMode()&&user.supabaseToken){try{updated={...updated,...(await saveProfilePatch(client.id,updated,user.supabaseToken)||{})};}catch(err){console.warn("cloud-client-dates",err);}}DB.setUsers(DB.users().map(u=>u.id===client.id?updated:u));setSelected(updated);refresh();};
    const saveProductVideo=async(e)=>{const file=e.target.files?.[0];if(!file)return;try{const mediaId=`vid-${client.id}-${Date.now()}`;const stored=await persistMedia({id:mediaId,file,mediaType:"product_video",owner:user,clientId:client.id});const video={...stored,name:file.name||"urun-videosu",size:file.size,type:file.type,assignedAt:todayKey(),coachId:user.id};const existing=[video,...(client.productVideos||[]).filter(v=>v.mediaId!==mediaId)];DB.setUsers(DB.users().map(u=>u.id===client.id?{...u,productVideo:video,productVideoDraft:video,productVideos:existing}:u));setSelected({...client,productVideo:video,productVideoDraft:video,productVideos:existing});refresh();}catch(err){alert("Video kaydedilemedi. Daha kısa veya daha düşük boyutlu bir video dene.");}e.target.value="";};
    return (
    <div style={{position:"absolute",inset:0,background:"rgba(10,31,22,.72)",zIndex:70,display:"flex",alignItems:"flex-end",overflow:"hidden",overscrollBehavior:"contain"}}>
      <div style={{background:C.white,borderRadius:"24px 24px 0 0",padding:"16px 20px calc(24px + env(safe-area-inset-bottom))",width:"100%",maxWidth:"100vw",maxHeight:"88%",overflowY:"auto",overflowX:"hidden",boxSizing:"border-box",overscrollBehavior:"contain"}}>
        <div style={{position:"sticky",top:-16,zIndex:3,display:"flex",gap:12,alignItems:"center",margin:"-16px -20px 14px",padding:"16px 20px 12px",background:"rgba(255,255,255,.96)",backdropFilter:"blur(12px)",borderBottom:`1px solid ${C.foam}`}}><Av ini={ini(client.name)} size={48}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:18,fontWeight:800,color:C.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",...F}}>{client.name}</div><div style={{fontSize:12,color:C.stone,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",...F}}>{client.email}</div></div><button onClick={onClose} aria-label="Kapat" style={{border:"none",background:C.foam,borderRadius:12,padding:"8px 12px",color:C.stone,flexShrink:0,...F}}>Kapat</button></div>
        <Card style={{padding:"14px",marginBottom:12,background:C.foam}}><div style={{fontSize:11,color:C.stone,marginBottom:4,...F}}>AKTIF PROGRAM</div><div style={{fontSize:17,fontWeight:800,color:C.ink,...F}}>{displayProgram(client)}</div><div style={{fontSize:12,color:C.stone,marginTop:4,...F}}>{client.goal}</div></Card><Card style={{padding:"14px",marginBottom:12}}><div style={{fontSize:13,fontWeight:800,color:C.ink,marginBottom:10,...F}}>Program Tarihleri</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><div><div style={{fontSize:10,fontWeight:800,color:C.stone,marginBottom:4,...F}}>Başlangıç</div><input type="date" value={(dates.programStartDate||"").slice(0,10)} onChange={e=>setDates(d=>({...d,programStartDate:e.target.value}))} style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${C.mint}`,borderRadius:12,padding:"10px",fontSize:12,color:C.ink,...F}}/></div><div><div style={{fontSize:10,fontWeight:800,color:C.stone,marginBottom:4,...F}}>Bitiş</div><input type="date" value={(dates.programEndDate||"").slice(0,10)} onChange={e=>setDates(d=>({...d,programEndDate:e.target.value}))} style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${C.mint}`,borderRadius:12,padding:"10px",fontSize:12,color:C.ink,...F}}/></div></div><button onClick={saveDates} style={{width:"100%",border:"none",background:C.mint,color:C.emerald,borderRadius:12,padding:"10px",fontSize:12,fontWeight:800,marginTop:10,...F}}>Tarihleri Kaydet</button></Card>
        <Card style={{padding:"14px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:10}}>
            <div><div style={{fontSize:13,fontWeight:800,color:C.ink,...F}}>Ürün Kullanım Videosu</div><div style={{fontSize:11,color:C.stone,marginTop:2,...F}}>Danışan ekranında 7 gün sabit kalır, koç tarafında taslak olarak saklanır.</div></div>
            <button onClick={()=>videoRef.current?.click()} style={{border:"none",background:C.mint,color:C.emerald,borderRadius:12,padding:"9px 11px",fontSize:11,fontWeight:800,...F}}>Video Yükle</button>
          </div>
          <input ref={videoRef} type="file" accept="video/*" onChange={saveProductVideo} style={{display:"none"}}/>
          {(client.productVideos||[client.productVideoDraft].filter(Boolean)).filter(v=>v?.mediaId||v?.url).length>0?<div style={{display:"grid",gap:10}}>{(client.productVideos||[client.productVideoDraft]).filter(v=>v?.mediaId||v?.url).map((v,i)=><div key={v.mediaId||i}><div style={{fontSize:11,fontWeight:900,color:i===0?C.emerald:C.stone,marginBottom:5,...F}}>{i===0?"Danışanda aktif":"Koç taslağı"} · {v.name}</div><ProductVideo video={v} style={{maxHeight:160}}/></div>)}</div>:<div style={{background:C.foam,borderRadius:14,padding:"14px",fontSize:12,color:C.stone,lineHeight:1.4,...F}}>Bu danışan için henüz ürün kullanım videosu eklenmedi.</div>}
        </Card>
        <div style={{display:"flex",gap:8,marginBottom:12}}><Metric l="Uyum" v={`%${client.compliance}`} c={client.compliance>=70?C.jade:C.warn}/><Metric l="Bekleyen" v={client.pendingToday??0}/><Metric l="Kaçan" v={client.missedToday??0} c={C.risk}/><Metric l="Foto" v={client.photoPendingToday??0} c={C.blue}/></div>
        <Card style={{padding:"14px",marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontSize:13,fontWeight:800,color:C.ink,...F}}>Beden Analizi</div><button onClick={()=>setBodyEdit(client)} style={{border:"none",background:C.foam,color:C.emerald,borderRadius:10,padding:"7px 9px",fontSize:11,fontWeight:800,...F}}>Düzenle</button></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[{l:"Başlangıç",v:`${client.body?.start||0} kg`},{l:"Güncel",v:`${client.body?.current||0} kg`},{l:"Hedef",v:`${client.body?.target||0} kg`},{l:"BMI",v:client.body?.bmi||"-"},{l:"Su",v:`%${client.body?.water||0}`},{l:"Kas",v:`%${client.body?.muscle||0}`}].map(x=><div key={x.l} style={{background:C.foam,borderRadius:10,padding:"9px"}}><div style={{fontSize:10,color:C.stone,...F}}>{x.l}</div><div style={{fontSize:14,fontWeight:800,color:C.ink,...F}}>{x.v}</div></div>)}</div></Card>
        {(()=>{if(!hasAssignedProgram(client))return <Card style={{padding:"16px",marginBottom:12}}><div style={{fontSize:14,fontWeight:800,color:C.ink,marginBottom:5,...F}}>Henüz program atanmadı</div><div style={{fontSize:12,color:C.stone,...F}}>Program atanınca görev bölümleri, yasaklı liste ve kullanım detayları burada açılacak.</div></Card>;const template=client.programDraft||getTemplateByClient(client);const tasks=template.tasks||templateTasks(client.programTemplateId);const sections=[...new Set(tasks.map(t=>t.section||"Genel"))];return <><Card style={{padding:"14px",marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontSize:13,fontWeight:800,color:C.ink,...F}}>Görev Bölümleri</div><button onClick={()=>setProgramEdit(client)} style={{border:"none",background:C.mint,color:C.emerald,borderRadius:10,padding:"7px 9px",fontSize:11,fontWeight:800,...F}}>Program Düzenle</button></div>{sections.map(sec=><div key={sec} style={{marginBottom:8}}><div style={{fontSize:11,fontWeight:900,color:C.emerald,margin:"6px 0",...F}}>{sec.toUpperCase()}</div>{tasks.filter(t=>(t.section||"Genel")===sec).map((t,i)=><TaskLine key={i} task={t} i={i}/>)}</div>)}</Card><Card style={{padding:"14px",marginBottom:12}}><div style={{fontSize:13,fontWeight:800,color:C.ink,marginBottom:10,...F}}>Kayıtlı Yasaklı Liste</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{(template.bannedFoods||BANNED_FOODS).map(x=><Pill key={x} bg="#fde8e6" color={C.risk}>{x}</Pill>)}</div></Card></>})()}<Card style={{padding:"14px",marginBottom:12}}><div style={{fontSize:13,fontWeight:800,color:C.ink,marginBottom:10,...F}}>Kayıtlı Programlar</div>{(client.programHistory||[{name:displayProgram(client),date:client.createdAt,duration:"Aktif",tasks:[]}]).map((p,i)=><div key={i} style={{padding:"10px 0",borderBottom:i<(client.programHistory||[]).length-1?`1px solid ${C.foam}`:"none"}}><div style={{display:"flex",justifyContent:"space-between"}}><b style={{fontSize:13,color:C.ink,...F}}>{p.name}</b><span style={{fontSize:11,color:C.stone,...F}}>{p.duration}</span></div><div style={{fontSize:11,color:C.stone,marginTop:4,...F}}>{p.date}{(p.tasks||[]).length?` · ${(p.tasks||[]).map(t=>t.title||t).join(", ")}`:""}</div></div>)}</Card>
        <div style={{display:"flex",gap:8}}><button onClick={()=>setProgramTarget(client)} style={{flex:1,border:"none",background:C.emerald,color:C.white,borderRadius:14,padding:"12px",fontWeight:800,...F}}>Program Ata</button><button onClick={()=>toggleBan(client)} style={{flex:1,border:`1px solid ${client.status==="banned"?C.jade:C.risk}`,background:client.status==="banned"?C.mint:"#fde8e6",color:client.status==="banned"?C.emerald:C.risk,borderRadius:14,padding:"12px",fontWeight:800,...F}}>{client.status==="banned"?"Yasağı Kaldır":"Yasakla"}</button></div>
      </div>
    </div>
  );}
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:C.mist,position:"relative"}}>
      {adding&&<div style={{position:"absolute",inset:0,background:"rgba(10,31,22,.72)",zIndex:60,display:"flex",alignItems:"flex-end"}}><div style={{background:C.white,borderRadius:"24px 24px 0 0",padding:"20px",width:"100%",boxSizing:"border-box"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div style={{fontSize:18,fontWeight:800,color:C.ink,...F}}>Danışan Ekle</div><button onClick={()=>setAdding(false)} style={{border:"none",background:C.foam,borderRadius:12,padding:"8px 12px",color:C.stone,...F}}>Kapat</button></div>{err&&<div style={{background:"#fde8e6",borderRadius:12,padding:"10px",color:C.risk,fontSize:12,marginBottom:10,...F}}>{err}</div>}{[{k:"name",l:"Ad soyad"},{k:"email",l:"E-posta"},{k:"phone",l:"Telefon"},{k:"goal",l:"Hedef"},{k:"password",l:"Geçici şifre"}].map(f=><div key={f.k} style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:800,color:C.ink,marginBottom:5,...F}}>{f.l}</div><input value={form[f.k]} onChange={e=>setForm(x=>({...x,[f.k]:e.target.value}))} type={f.t||"text"} style={{width:"100%",border:`1.5px solid ${C.mint}`,borderRadius:13,padding:"12px",outline:"none",fontSize:13,...F}}/></div>)}<button onClick={createClient} style={{width:"100%",border:"none",background:C.emerald,color:C.white,borderRadius:15,padding:"13px",fontWeight:800,...F}}>Danışanı Oluştur</button></div></div>}
      {selected&&<DetailSheet client={selected} onClose={()=>setSelected(null)}/>} {programTarget&&<ProgramPicker client={programTarget} onClose={()=>setProgramTarget(null)}/>} {programEdit&&<ProgramEditor client={programEdit} onClose={()=>setProgramEdit(null)}/>} {bodyEdit&&<BodyEditor client={bodyEdit} onClose={()=>setBodyEdit(null)}/>} 
      <div style={{background:"rgba(255,255,255,.74)",padding:"8px 20px 0",backdropFilter:"blur(14px)",borderBottom:"1px solid rgba(255,255,255,.78)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div><div style={{fontSize:11,color:C.stone,fontWeight:600,letterSpacing:.5,...F}}>DANIŞANLAR</div><div style={{fontSize:22,fontWeight:800,color:C.ink,...F}}>{fil.length} kişi</div></div><button onClick={()=>setAdding(true)} style={{border:"none",background:C.emerald,color:C.white,borderRadius:14,padding:"10px 14px",fontSize:12,fontWeight:800,...F}}>+ Ekle</button></div>
        <div style={{display:"flex",alignItems:"center",gap:10,background:C.foam,borderRadius:14,padding:"10px 14px",border:`1px solid ${C.mint}`,marginBottom:12}}><Ico d={IC.search} size={16} color={C.stone}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Danışan ara…" style={{border:"none",background:"none",outline:"none",fontSize:13,color:C.ink,width:"100%",...F}}/></div>
        <div style={{display:"flex",gap:6,paddingBottom:14}}>{["Tümü","Aktif","Riskli","Yasaklı"].map(t=><button key={t} onClick={()=>setTab(t)} style={{flex:1,border:"none",borderRadius:20,padding:"6px 0",fontSize:11,fontWeight:700,cursor:"pointer",background:tab===t?C.emerald:C.foam,color:tab===t?C.white:C.stone,...F}}>{t}{t==="Yasaklı"&&banned.length?` (${banned.length})`:""}</button>)}</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"12px 16px"}}>
        {fil.length===0?<div style={{textAlign:"center",padding:"40px 20px",color:C.stone,fontSize:13,...F}}>Danışan bulunamadı<br/><b style={{color:C.emerald}}>Ref: {user.refCode}</b></div>:fil.map((c,i)=>{const completedTasks=Array.isArray(c.tasks)?c.tasks:[];const risk=isRiskClient(c);const compliance=c.compliance||0;return(<Card key={i} onClick={()=>setSelected(c)} style={{padding:"16px",marginBottom:10,border:c.status==="banned"?`1.5px solid ${C.risk}`:risk?`1.5px solid #ffd4d0`:"1px solid rgba(13,61,43,.06)"}}><div style={{display:"flex",gap:12,alignItems:"center",marginBottom:10}}><Av ini={ini(c.name)} size={44} bg={risk?"#fde8e6":C.mint} fg={risk?C.risk:C.emerald}/><div style={{flex:1}}><div style={{fontSize:15,fontWeight:800,color:C.ink,...F}}>{c.name}</div><div style={{fontSize:11,color:C.stone,...F}}>{displayProgram(c)} · {c.goal||c.email}</div></div><Pill bg={c.status==="banned"?"#fde8e6":risk?"#fde8e6":C.mint} color={c.status==="banned"?C.risk:risk?C.risk:C.emerald}>{c.status==="banned"?"Yasaklı":risk?"Riskli":"Aktif"}</Pill></div><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><div style={{flex:1,height:6,background:C.foam,borderRadius:3,overflow:"hidden"}}><div style={{width:`${compliance}%`,height:"100%",borderRadius:3,background:compliance>=70?C.jade:compliance>=50?C.warn:C.risk}}/></div><span style={{fontSize:12,fontWeight:800,color:C.ink,...F}}>%{compliance}</span></div><div style={{display:"flex",gap:8}}><Metric l="Tamamlandı" v={completedTasks.filter(Boolean).length} c={C.emerald}/><Metric l="Bekleyen" v={currentPendingCount(c)}/><Metric l="Fotoğraf" v={hasAssignedProgram(c)?(c.photoPendingToday||0):0} c={C.blue}/></div></Card>);})}
      </div>
    </div>
  );
};
const CoachMsgs=({user,allUsers})=>{
  const [sel,setSel]=useState(null);const [msg,setMsg]=useState("");const [mediaOpen,setMediaOpen]=useState(false);const [,forceUpdate]=useState(0);
  const [enabled,setEnabled]=useState(user.clientMessagesOpen!==false);
  const clients=allUsers.filter(u=>u.role==="client"&&u.coachId===user.id);
  const ref=useRef();const photoRef=useRef(null);const recRef=useRef(null);const chunksRef=useRef([]);const [recording,setRecording]=useState(false);const [voiceDraft,setVoiceDraft]=useState(null);const [recordSeconds,setRecordSeconds]=useState(0);
  const canSend=enabled;
  const toggleMessaging=()=>{const nextEnabled=!enabled;setEnabled(nextEnabled);const next={...user,clientMessagesOpen:nextEnabled};DB.setUsers(DB.users().map(u=>u.id===user.id?next:u));saveSession(next);forceUpdate(n=>n+1);};
  const conv=(cid)=>conversationBetween(DB.msgs(),user.id,cid);
  const pushMsg=async(extra)=>{if(!sel||!canSend)return;const record=await createMessageRecord({user,to:sel.id,extra,logLabel:"cloud-message"});DB.setMsgs([...DB.msgs(),record]);forceUpdate(n=>n+1);};
  const send=()=>{if(!msg.trim()||!sel||!canSend)return;pushMsg({text:msg.trim(),kind:"text"});setMsg("");};
  const sendFile=async(e,kind)=>{const file=e.target.files?.[0];if(!file||!sel||!canSend)return;try{pushMsg(await createMediaMessageDraft({kind,file,user,clientId:sel.id,idPrefix:"msg"}));}catch{alert("Medya kaydedilemedi. Lütfen tekrar dene.");}e.target.value="";};
  const startRecord=async(e)=>{e?.preventDefault?.();if(!sel||!canSend||recording)return;setVoiceDraft(null);try{if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined"){alert("Bu cihazda mikrofon kaydı desteklenmiyor.");return;}const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});const rec=new MediaRecorder(stream);chunksRef.current=[];rec.ondataavailable=e=>e.data.size&&chunksRef.current.push(e.data);rec.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunksRef.current,{type:rec.mimeType||"audio/webm"});if(blob.size<900){setRecording(false);return;}const reader=new FileReader();reader.onload=()=>setVoiceDraft({url:reader.result,blob,name:"sesli-mesaj.webm"});reader.readAsDataURL(blob);setRecording(false);};recRef.current=rec;rec.start();setRecording(true);}catch(err){console.warn("voice-record-error",err);setRecording(false);alert("Mikrofon izni verilemedi. Android ayarlarından mikrofon iznini kontrol et.");}};
  const stopRecord=()=>{if(recording)recRef.current?.stop();};
  const sendVoiceDraft=async()=>{if(!voiceDraft)return;try{pushMsg(await createMediaMessageDraft({kind:"audio",file:voiceDraft.blob,user,clientId:sel.id,idPrefix:"msg",name:voiceDraft.name}));setVoiceDraft(null);}catch{alert("Sesli mesaj kaydedilemedi.");}};
  const deleteVoiceDraft=()=>setVoiceDraft(null);
  const renderMsg=(m,isMe)=><><div>{m.kind==="photo"&&(m.url||m.mediaId)?<MediaImage media={m} alt="" style={{width:170,maxWidth:"100%",borderRadius:12,display:"block",marginBottom:6}}/>:m.kind==="audio"&&(m.url||m.mediaId)?<MediaAudio media={m} style={{width:190,maxWidth:"100%"}}/>:m.text}</div><div style={{fontSize:10,opacity:.55,marginTop:4,textAlign:"right"}}>{m.time}</div></>;
  useEffect(()=>ref.current?.scrollIntoView({behavior:"smooth"}),[sel,msg]);
  useEffect(()=>{if(!recording){setRecordSeconds(0);return;}const started=Date.now();const timer=setInterval(()=>setRecordSeconds(Math.floor((Date.now()-started)/1000)),250);return()=>clearInterval(timer);},[recording]);
  useEffect(()=>{if(sel)syncConversationRead({markLocalRead:markMessagesRead,user,fromId:sel.id,logLabel:"cloud-read"}).then(changed=>changed&&forceUpdate(n=>n+1));},[sel?.id]);
  if(sel){const msgs=conv(sel.id);return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:C.mist,position:"relative"}}>
      <div style={{background:"rgba(255,255,255,.74)",padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,.78)",backdropFilter:"blur(14px)",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={()=>setSel(null)} style={{border:"none",background:C.foam,width:36,height:36,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Ico d={IC.back} size={16} color={C.emerald}/></button>
        <Avatar user={sel} size={42}/>
        <div style={{flex:1}}><div style={{fontSize:15,fontWeight:800,color:C.ink,...F}}>{sel.name}</div><div style={{fontSize:11,color:enabled?C.jade:C.risk,fontWeight:600,...F}}>{enabled?"● Sohbet açık":"Sohbet kapalı"}</div></div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
        {msgs.map((m,i)=>{const isMe=m.from===user.id;return(
          <div key={i} style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",alignItems:"flex-end",gap:8}}>
            {!isMe&&<Av ini={ini(sel.name)} size={26}/>}
            <div style={{background:isMe?C.emerald:C.white,color:isMe?C.white:C.ink,borderRadius:isMe?"20px 20px 4px 20px":"20px 20px 20px 4px",padding:"10px 14px",maxWidth:"74%",fontSize:13,lineHeight:1.5,boxShadow:"0 1px 6px rgba(13,61,43,.08)",...F}}>
              {renderMsg(m,isMe)}
            </div>
            {isMe&&<Av ini={ini(user.name)} size={26} bg={C.forest} fg={C.white}/>}
          </div>
        );})}<div ref={ref}/>
      </div>
      <div style={{padding:"10px 16px 12px",background:C.white,borderTop:`1px solid ${C.mint}`}}>
        <input ref={photoRef} type="file" accept="image/*" onChange={e=>sendFile(e,"photo")} style={{display:"none"}}/>
        {!enabled&&<div style={{fontSize:11,color:C.risk,fontWeight:800,marginBottom:8,...F}}>Danışan mesajlaşması koç tarafından kapalı.</div>}
        {recording&&<div style={{display:"flex",alignItems:"center",gap:10,background:"#fff8f7",border:`1px solid #ffd4d0`,borderRadius:16,padding:"9px 10px",marginBottom:8,boxShadow:"0 8px 22px rgba(217,79,61,.10)"}}><span style={{width:10,height:10,borderRadius:"50%",background:C.risk,boxShadow:`0 0 0 6px rgba(217,79,61,.12)`,flexShrink:0}}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:900,color:C.risk,...F}}>Ses kaydı alınıyor</div><div style={{fontSize:11,color:C.stone,...F}}>Bitirmek için mikrofona veya Bitir'e bas.</div></div><div style={{fontSize:13,fontWeight:900,color:C.ink,minWidth:42,textAlign:"right",...F}}>{fmtDuration(recordSeconds)}</div><button onClick={stopRecord} style={{border:"none",background:C.risk,color:C.white,borderRadius:11,padding:"8px 10px",fontSize:11,fontWeight:900,...F}}>Bitir</button></div>}
        {voiceDraft&&<div style={{display:"flex",alignItems:"center",gap:8,background:C.foam,border:`1px solid ${C.mint}`,borderRadius:16,padding:"8px 10px",marginBottom:8}}><audio src={voiceDraft.url} controls style={{flex:1,height:32}}/><button onClick={deleteVoiceDraft} style={{border:"none",background:"#fde8e6",color:C.risk,borderRadius:10,padding:"8px 10px",fontSize:11,fontWeight:900,...F}}>Sil</button><button onClick={sendVoiceDraft} style={{border:"none",background:C.emerald,color:C.white,borderRadius:10,padding:"8px 10px",fontSize:11,fontWeight:900,...F}}>Gönder</button></div>}
        {mediaOpen&&<div style={{display:"flex",gap:8,alignItems:"center",background:C.white,border:`1px solid ${C.mint}`,borderRadius:16,padding:"8px",marginBottom:8,boxShadow:"0 8px 20px rgba(13,61,43,.08)"}}><button disabled={!canSend} onClick={()=>{setMediaOpen(false);photoRef.current?.click();}} style={{border:"none",background:C.blueBg,color:C.blue,borderRadius:12,padding:"9px 12px",fontSize:12,fontWeight:900,display:"flex",alignItems:"center",gap:6,...F}}><Ico d={IC.cam} size={16} color={C.blue}/>Fotoğraf ekle</button></div>}
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <button disabled={!canSend} onClick={()=>setMediaOpen(v=>!v)} style={{width:42,height:42,border:"none",background:C.foam,color:canSend?C.emerald:C.stone,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",...F}}><Ico d={IC.plus} size={18} color={canSend?C.emerald:C.stone}/></button>
          <button disabled={!canSend} onClick={recording?stopRecord:startRecord} style={{width:42,height:42,border:"none",background:recording?"#fde8e6":canSend?C.mint:C.foam,color:recording?C.risk:canSend?C.emerald:C.stone,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",...F}}><Ico d={IC.mic} size={18} color={recording?C.risk:canSend?C.emerald:C.stone}/></button>
          <div style={inputShellStyle()}>
            <input disabled={!canSend} value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={canSend?"Mesaj yaz...":"Mesaj kapalı"} style={{border:"none",background:"none",outline:"none",fontSize:13,color:C.ink,width:"100%",...F}}/>
          </div>
          <button disabled={!canSend} onClick={send} style={{width:44,height:44,borderRadius:16,background:canSend?C.emerald:C.pebble,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:canSend?"pointer":"default",boxShadow:canSend?`0 4px 12px rgba(26,102,69,.35)`:"none"}}><Ico d={IC.send} size={18} color={C.white}/></button>
        </div>
      </div>
    </div>
  );}
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:C.mist,position:"relative"}}>
      <div style={{background:"rgba(255,255,255,.74)",padding:"8px 20px 16px",backdropFilter:"blur(14px)",borderBottom:"1px solid rgba(255,255,255,.78)"}}>
        <div style={{fontSize:11,color:C.stone,fontWeight:600,letterSpacing:.5,...F}}>MESAJLAR</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><div style={{fontSize:22,fontWeight:800,color:C.ink,...F}}>Danışanlarım</div><button onClick={toggleMessaging} aria-pressed={enabled} style={{border:"none",background:enabled?C.emerald:"#fde8e6",color:enabled?C.white:C.risk,borderRadius:999,padding:"6px 8px 6px 12px",fontSize:11,fontWeight:900,display:"flex",alignItems:"center",gap:8,cursor:"pointer",minWidth:86,justifyContent:"space-between",...F}}><span>{enabled?"Açık":"Kapalı"}</span><span style={{width:22,height:22,borderRadius:"50%",background:C.white,boxShadow:"0 2px 6px rgba(0,0,0,.18)",display:"block"}}/></button></div>
        <div style={{fontSize:11,color:C.stone,marginTop:6,...F}}>{enabled?"Danışan sohbeti herkese açık.":"Danışan sohbeti herkese kapalı."}</div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {clients.length===0?<div style={{padding:"40px 20px",textAlign:"center",color:C.stone,fontSize:13,...F}}>Henüz danışan yok</div>
        :clients.map((c,i)=>{const msgs=conv(c.id);const last=msgs[msgs.length-1];const unread=unreadCountFrom(user.id,c.id);const lastFromClient=last?.from===c.id;const lastText=messagePreviewText(last);return(
          <div key={i} onClick={()=>setSel(c)} style={{display:"flex",gap:12,padding:"14px 20px",borderBottom:`1px solid ${C.foam}`,background:unread?C.foam:C.white,cursor:"pointer",alignItems:"center"}}>
            <Av ini={ini(c.name)} size={46}/>
            <div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{fontSize:14,fontWeight:unread?900:700,color:C.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",...F}}>{c.name}</div>{unread>0&&<span style={{background:C.risk,color:C.white,borderRadius:999,minWidth:22,height:22,padding:"0 7px",boxSizing:"border-box",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,...F}}>{unread}</span>}</div><div style={{fontSize:12,color:unread?C.emerald:C.stone,fontWeight:unread?800:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",...F}}>{last?`${lastFromClient?c.name:"Sen"}: ${lastText||"Mesaj"}`:"Henüz mesaj yok"}</div></div>
            {last&&<div style={{fontSize:11,color:unread?C.emerald:C.stone,fontWeight:unread?800:500,flexShrink:0,...F}}>{last.time}</div>}
          </div>
        );})}
      </div>
    </div>
  );
};

// ── COACH CALENDAR ──

const CoachGroupChat=({user,allUsers})=>{
  const [msg,setMsg]=useState("");const [,forceUpdate]=useState(0);
  const ref=useRef();const photoRef=useRef(null);const audioRef=useRef(null);
  const coaches=allUsers.filter(u=>u.role==="coach");
  const list=()=>roomMessages(DB.msgs(),"coaches");
  const pushMsg=async(extra)=>{const record=await createMessageRecord({user,room:"coaches",extra,logLabel:"cloud-group-message"});DB.setMsgs([...DB.msgs(),record]);forceUpdate(n=>n+1);};
  const send=()=>{if(!msg.trim())return;pushMsg({text:msg.trim(),kind:"text"});setMsg("");};
  const sendFile=async(e,kind)=>{const file=e.target.files?.[0];if(!file)return;try{pushMsg(await createMediaMessageDraft({kind,file,user,idPrefix:"group"}));}catch{alert("Medya kaydedilemedi. Lütfen tekrar dene.");}e.target.value="";};
  const renderMsg=(m)=>m.kind==="photo"&&(m.url||m.mediaId)?<MediaImage media={m} alt="" style={{width:170,maxWidth:"100%",borderRadius:12,display:"block",marginBottom:6}}/>:m.kind==="audio"&&(m.url||m.mediaId)?<MediaAudio media={m} style={{width:190,maxWidth:"100%"}}/>:<div>{m.text}</div>;
  useEffect(()=>ref.current?.scrollIntoView({behavior:"smooth"}),[msg]);
  return <div style={{display:"flex",flexDirection:"column",height:"100%",background:C.mist}}>
    <div style={{background:"rgba(255,255,255,.74)",padding:"8px 20px 16px",borderBottom:"1px solid rgba(255,255,255,.78)",backdropFilter:"blur(14px)"}}><div style={{fontSize:11,color:C.stone,fontWeight:600,letterSpacing:.5,...F}}>KOÇ SOHBETİ</div><div style={{fontSize:22,fontWeight:800,color:C.ink,...F}}>Koçlar Arası</div><div style={{fontSize:11,color:C.stone,marginTop:5,...F}}>{coaches.length} koç bu ortak alana erişebilir. Danışanlar göremez.</div></div>
    <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:10}}>{list().length===0&&<div style={{textAlign:"center",padding:"36px 18px",color:C.stone,fontSize:13,...F}}>Henüz koç mesajı yok.</div>}{list().map((m,i)=>{const isMe=m.from===user.id;const sender=allUsers.find(u=>u.id===m.from);return <div key={i} style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",alignItems:"flex-end",gap:8}}>{!isMe&&<Av ini={ini(sender?.name)} size={28} bg={C.forest} fg={C.white}/>}<div style={{background:isMe?C.emerald:C.white,color:isMe?C.white:C.ink,borderRadius:isMe?"20px 20px 4px 20px":"20px 20px 20px 4px",padding:"10px 14px",maxWidth:"76%",fontSize:13,lineHeight:1.5,boxShadow:"0 1px 6px rgba(13,61,43,.08)",...F}}>{!isMe&&<div style={{fontSize:10,fontWeight:900,color:C.emerald,marginBottom:4,...F}}>{sender?.name||"Koç"}</div>}{renderMsg(m)}<div style={{fontSize:10,opacity:.55,marginTop:4,textAlign:"right"}}>{m.time}</div></div>{isMe&&<Av ini={ini(user.name)} size={28} bg={C.emerald} fg={C.white}/>}</div>})}<div ref={ref}/></div>
    <div style={{padding:"10px 16px 12px",background:C.white,borderTop:`1px solid ${C.mint}`}}><input ref={photoRef} type="file" accept="image/*" onChange={e=>sendFile(e,"photo")} style={{display:"none"}}/><input ref={audioRef} type="file" accept="audio/*" onChange={e=>sendFile(e,"audio")} style={{display:"none"}}/><div style={{display:"flex",gap:8,alignItems:"flex-end"}}><button onClick={()=>photoRef.current?.click()} style={{border:"none",background:C.blueBg,color:C.blue,borderRadius:14,padding:"12px 10px",fontSize:11,fontWeight:800,...F}}>Foto</button><button onClick={()=>audioRef.current?.click()} style={{border:"none",background:C.mint,color:C.emerald,borderRadius:14,padding:"12px 10px",fontSize:11,fontWeight:800,...F}}>Ses</button><div style={inputShellStyle()}><input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Koçlara yaz..." style={{border:"none",background:"none",outline:"none",fontSize:13,color:C.ink,width:"100%",...F}}/></div><button onClick={send} style={{width:44,height:44,borderRadius:16,background:C.emerald,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:`0 4px 12px rgba(26,102,69,.35)`}}><Ico d={IC.send} size={18} color={C.white}/></button></div></div>
  </div>;
};

const CoachCal=({user,allUsers})=>{
  const today=new Date();
  const todayIso=todayIsoDate(today);
  const [weekOffset,setWeekOffset]=useState(0);
  const dates=weekDateItems(today,weekOffset);
  const [sel,setSel]=useState(todayIso);
  const [adding,setAdding]=useState(false);
  const [,forceUpdate]=useState(0);
  const clients=allUsers.filter(u=>u.role==="client"&&u.coachId===user.id);
  const [form,setForm]=useState({clientId:clients[0]?.id||"",type:"İlerleme görüşmesi",date:todayIso,time:"10:00",duration:"30 dk",status:"confirmed"});
  const days=dates.map(d=>d.label);
  const sessions=sessionsForCoach(DB.sess(),user.id);
  const daySess=sessionsForDate(sessions,sel);
  const updateSession=async(id,patch)=>{const applied=applySessionPatch(DB.sess(),id,patch);let updated=applied.updated;if(isProductionMode()&&user.supabaseToken){try{updated={...updated,...(await updateCloudAppointment(id,patch,user.supabaseToken)||{})};}catch(err){console.warn("cloud-session-update",err);}}DB.setSess(DB.sess().map(s=>s.id===id?updated:s));const notice=coachSessionNotice(updated,patch);if(applied.current?.clientId&&notice)addNotice(applied.current.clientId,notice,"session");forceUpdate(n=>n+1);};
  const createSession=async()=>{
    if(!form.clientId)return;
    const s=buildCoachSession({coachId:user.id,form});
    let saved=s;if(isProductionMode()&&user.supabaseToken){try{saved=await createCloudAppointment(s,user.supabaseToken)||s;}catch(err){console.warn("cloud-session-create",err);}}
    DB.setSess([...DB.sess(),saved]);addNotice(form.clientId,coachCreatedSessionNotice(saved),"session");
    setSel(form.date||sel);
    setAdding(false);
    forceUpdate(n=>n+1);
  };
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:C.mist,position:"relative"}}>
      {adding&&<div style={{position:"absolute",inset:0,background:"rgba(10,31,22,.72)",zIndex:60,display:"flex",alignItems:"flex-end"}}><div style={{background:C.white,borderRadius:"24px 24px 0 0",padding:"20px",width:"100%",boxSizing:"border-box"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div><div style={{fontSize:18,fontWeight:800,color:C.ink,...F}}>Seans Ekle</div><div style={{fontSize:12,color:C.stone,...F}}>Takvimde danışan görüşmesi oluştur</div></div><button onClick={()=>setAdding(false)} style={buttonStyle({variant:"soft",style:{borderRadius:12,padding:"8px 12px"}})}>Kapat</button></div>
        <div style={{display:"grid",gap:9}}>
          <select value={form.clientId} onChange={e=>setForm(f=>({...f,clientId:e.target.value}))} style={controlStyle()}>{clients.length===0?<option value="">Danışan yok</option>:clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} placeholder="Seans tipi" style={controlStyle()}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={controlStyle()}/><input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} style={controlStyle()}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><select value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} style={controlStyle()}><option>15 dk</option><option>30 dk</option><option>45 dk</option><option>60 dk</option></select><select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={controlStyle()}><option value="confirmed">Onaylı</option><option value="pending">Bekliyor</option></select></div>
          <button onClick={createSession} disabled={!form.clientId} style={buttonStyle({disabled:!form.clientId,style:{width:"100%",borderRadius:15,padding:"13px"}})}>Seansı Kaydet</button>
        </div>
      </div></div>}
      <div style={{background:"rgba(255,255,255,.74)",padding:"8px 20px 0",backdropFilter:"blur(14px)",borderBottom:"1px solid rgba(255,255,255,.78)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div><div style={{fontSize:11,color:C.stone,fontWeight:600,letterSpacing:.5,...F}}>TAKVİM</div><div style={{fontSize:22,fontWeight:800,color:C.ink,...F}}>{new Date(sel).toLocaleDateString("tr-TR",{month:"long",year:"numeric"})}</div></div>
          <button onClick={()=>setAdding(true)} style={{background:C.emerald,border:"none",borderRadius:14,padding:"10px 16px",color:C.white,fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:`0 4px 12px rgba(26,102,69,.3)`,...F}}><Ico d={IC.plus} size={14} color={C.white}/>Seans</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"36px 1fr 36px",gap:8,alignItems:"start",paddingBottom:16}}><button onClick={()=>setWeekOffset(w=>w-1)} style={{height:36,border:"none",borderRadius:12,background:C.foam,color:C.emerald,fontWeight:900}}>‹</button><div style={{display:"flex",justifyContent:"space-between"}}>
          {days.map((d,i)=>{const date=dates[i],has=sessions.some(s=>s.date===date.iso),on=sel===date.iso;return(
            <div key={d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
              <span style={{fontSize:10,color:on?C.emerald:C.stone,fontWeight:on?700:500,...F}}>{d}</span>
              <button onClick={()=>setSel(date.iso)} style={{width:36,height:36,borderRadius:12,border:"none",background:on?C.emerald:"transparent",color:on?C.white:C.ink,fontWeight:on?800:500,fontSize:14,cursor:"pointer",boxShadow:on?`0 4px 10px rgba(26,102,69,.3)`:"none",transition:"all .2s",...F}}>{date.day}</button>
              <div style={{width:4,height:4,borderRadius:"50%",background:has?(on?C.white:C.jade):"transparent"}}/>
            </div>
          );})}
        </div><button onClick={()=>setWeekOffset(w=>w+1)} style={{height:36,border:"none",borderRadius:12,background:C.foam,color:C.emerald,fontWeight:900}}>›</button></div>
        {daySess.length>0&&<div style={{display:"flex",gap:8,paddingBottom:16}}>
          {[{l:"Toplam",v:daySess.length,bg:C.foam,c:C.ink},{l:"Onaylı",v:daySess.filter(s=>s.status==="confirmed").length,bg:C.mint,c:C.emerald},{l:"Bekliyor",v:daySess.filter(s=>s.status==="pending").length,bg:"#fff4e0",c:C.warn}].map((s,i)=>(
            <div key={i} style={{flex:1,background:s.bg,borderRadius:12,padding:"8px 0",textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:s.c,...F}}>{s.v}</div><div style={{fontSize:10,color:C.stone,...F}}>{s.l}</div></div>
          ))}
        </div>}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
        {daySess.length===0?<div style={{textAlign:"center",padding:"48px 24px"}}><div style={{width:60,height:60,borderRadius:20,background:C.mint,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center"}}><Ico d={IC.cal} size={26} color={C.stone}/></div><div style={{fontSize:14,fontWeight:700,color:C.ink,...F}}>Seans yok</div></div>
        :daySess.map((s,i)=>{const client=allUsers.find(u=>u.id===s.clientId);return(
          <Card key={i} style={{padding:"14px 16px",marginBottom:10,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{textAlign:"center",minWidth:44}}><div style={{fontSize:15,fontWeight:800,color:C.ink,...F}}>{s.time}</div><div style={{fontSize:10,color:C.stone,...F}}>{s.duration}</div></div>
            <div style={{width:1.5,height:40,background:C.mint,borderRadius:1}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><Av ini={ini(client?.name)} size={28}/><span style={{fontSize:14,fontWeight:700,color:C.ink,...F}}>{client?.name||"?"}</span></div>
              <div style={{fontSize:12,color:C.stone,...F}}>{s.type}</div>
            </div>
            <Pill bg={s.status==="done"?C.foam:s.status==="pending"?"#fff4e0":s.status==="proposed"?C.blueBg:C.mint} color={s.status==="done"?C.stone:s.status==="pending"?C.warn:s.status==="proposed"?C.blue:C.emerald}>{s.status==="done"?"Bitti":s.status==="pending"?"Bekliyor":s.status==="proposed"?"Yeni saat":"Onaylı"}</Pill>
            {s.status==="pending"&&<div style={{width:"100%",display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>updateSession(s.id,{status:"confirmed"})} style={{border:"none",background:C.mint,color:C.emerald,borderRadius:10,padding:"7px 10px",fontSize:11,fontWeight:800,...F}}>Onayla</button><button onClick={()=>{const date=window.prompt("Yeni tarih (YYYY-MM-DD)",s.date);const time=date&&window.prompt("Yeni saat (HH:MM)",s.time);if(date&&time)updateSession(s.id,{date,time,status:"proposed"});}} style={{border:"none",background:C.blueBg,color:C.blue,borderRadius:10,padding:"7px 10px",fontSize:11,fontWeight:800,...F}}>Yeni Saat Öner</button></div>}
          </Card>
        );})}
      </div>
    </div>
  );
};

// ── COACH REPORTS ──
const CoachReports=({user,allUsers})=>{
  const [period,setPeriod]=useState("7G");const anim=useAnim(period);
  const [,forceProofUpdate]=useState(0);
  const [weightDraft,setWeightDraft]=useState({});
  const clients=coachReportClients(Array.isArray(allUsers)&&allUsers.length?allUsers:DB.users(),user.id);
  const avg=averageCompliance(clients);
  const risky=riskClients(clients,isRiskClient);
  const logs=recentTaskLogsForClients(DB.taskLogs(),clients);
  const saveWeight=async(client)=>{
    const val=Number(weightDraft[client.id]);
    if(!val)return;
    const currentClient=DB.users().find(u=>u.id===client.id)||client;
    const weightUpdate=buildWeightUpdate(currentClient,val);
    if(isProductionMode()&&user.supabaseToken){
      try{await createCloudBodyMetric({clientId:client.id,coachId:user.id,body:weightUpdate.body,note:"Koç güncel kilo girişi"},user.supabaseToken);}catch(err){console.warn("cloud-weight",err);}
    }
    DB.setUsers(DB.users().map(u=>{
      if(u.id!==client.id)return u;
      return {...u,...weightUpdate};
    }));
    setWeightDraft(d=>({...d,[client.id]:""}));
    forceProofUpdate(n=>n+1);
  };
  const bars=reportTrendBars(avg);
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:C.mist,position:"relative"}}>
      <div style={{background:"rgba(255,255,255,.74)",padding:"8px 20px 16px",backdropFilter:"blur(14px)",borderBottom:"1px solid rgba(255,255,255,.78)"}}>
        <div style={{fontSize:11,color:C.stone,fontWeight:600,letterSpacing:.5,...F}}>RAPOR</div>
        <div style={{fontSize:22,fontWeight:800,color:C.ink,...F}}>Performans</div>
        <div style={{display:"flex",gap:6,marginTop:12}}>
          {["7G","30G","3A"].map(p=><button key={p} onClick={()=>setPeriod(p)} style={{flex:1,border:"none",borderRadius:12,padding:"8px 0",fontSize:12,fontWeight:700,cursor:"pointer",background:period===p?C.emerald:C.foam,color:period===p?C.white:C.stone,...F}}>{p}</button>)}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {[{l:"Ort. Uyum",v:`%${avg}`,c:C.emerald,bg:C.mint},{l:"Aktif Danışan",v:clients.length,c:C.blue,bg:C.blueBg},{l:"Riskli",v:risky.length,c:C.risk,bg:"#fde8e6"},{l:"Eksilen Kilo",v:`${totalLostWeight(clients).toFixed(1)} kg`,c:C.warn,bg:"#fff4e0"}].map((s,i)=>(
            <Card key={i} style={{padding:"14px 16px"}}><div style={{fontSize:10,color:C.stone,marginBottom:4,...F}}>{s.l}</div><div style={{fontSize:22,fontWeight:800,color:s.c,...F}}>{s.v}</div></Card>
          ))}
        </div>
        <Card style={{padding:"16px",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:C.ink,marginBottom:14,...F}}>Uyum Trendi</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:6,height:90,marginBottom:8}}>
            {bars.map((v,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",height:"100%",justifyContent:"flex-end"}}><div style={{width:"100%",borderRadius:"4px 4px 0 0",height:`${anim*(v/100)*100}%`,transition:"height .05s",background:v>=70?C.jade:v>=50?C.warn:C.risk}}/></div>)}
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            {["Pt","Sa","Çr","Pr","Cu","Ct","Pz"].map((l,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:9,color:C.stone,...F}}>{l}</div>)}
          </div>
        </Card>
        <div style={{fontSize:13,fontWeight:700,color:C.ink,margin:"0 0 10px",...F}}>Güncel Kilo Girişi</div>
        <Card style={{padding:"4px 14px",marginBottom:16}}>
          {clients.length===0?<div style={{padding:"14px 0",fontSize:12,color:C.stone,...F}}>Bu koça bağlı danışan bulunamadı.</div>:clients.map((c,i)=>{const d=weightDelta(c.body||{});return <div key={c.id} style={{padding:"11px 0",borderBottom:i<clients.length-1?`1px solid ${C.foam}`:"none",display:"flex",gap:8,alignItems:"center"}}><Av ini={ini(c.name)} size={30}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:800,color:C.ink,...F}}>{c.name}</div><div style={{fontSize:11,color:C.stone,...F}}>Güncel {c.body?.current||0} kg · Değişim {d>0?`-${d}`:d<0?`+${Math.abs(d)}`:"0"} kg</div></div><input type="number" placeholder="kg" value={weightDraft[c.id]??""} onChange={e=>setWeightDraft(w=>({...w,[c.id]:e.target.value}))} style={{width:58,border:`1.5px solid ${C.mint}`,borderRadius:10,padding:"8px",fontSize:12,color:C.ink,...F}}/><button onClick={()=>saveWeight(c)} style={{border:"none",background:C.mint,color:C.emerald,borderRadius:10,padding:"8px 9px",fontSize:11,fontWeight:800,...F}}>Kaydet</button></div>})}
        </Card>
        <div style={{fontSize:13,fontWeight:700,color:C.ink,marginBottom:10,...F}}>Danışan Sıralaması</div>
        <Card>
          {clientsByCompliance(clients).map((c,i)=>{const compliance=Number(c.compliance)||0;return (
            <div key={c.id} style={{padding:"12px 16px",borderBottom:i<clients.length-1?`1px solid ${C.foam}`:"none",display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:13,fontWeight:700,color:C.pebble,minWidth:20,...F}}>#{i+1}</div>
              <Av ini={ini(c.name)} size={32}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:C.ink,marginBottom:4,...F}}>{c.name}</div>
                <div style={{height:5,background:C.foam,borderRadius:3,overflow:"hidden"}}><div style={{width:`${anim*compliance}%`,height:"100%",borderRadius:3,background:compliance>=70?C.jade:compliance>=50?C.warn:C.risk,transition:"width .05s"}}/></div>
              </div>
              <span style={{fontSize:14,fontWeight:800,color:C.ink,...F}}>%{compliance}</span>
            </div>
          );})}
        </Card>
        <div style={{fontSize:13,fontWeight:700,color:C.ink,margin:"16px 0 10px",...F}}>Aylık Danışan Başarı Sıralaması</div>
        <Card style={{padding:"4px 14px"}}>
          {clientsByMonthlyScore(clients).map((c,i)=>{const b=monthlyBadge(c,i);return <div key={c.id} style={{padding:"11px 0",borderBottom:i<clients.length-1?`1px solid ${C.foam}`:"none",display:"flex",gap:10,alignItems:"center"}}><div style={{fontSize:24,width:32,textAlign:"center"}}>{rankIcon(i)}</div><div style={{flex:1}}><div style={{fontSize:12,fontWeight:800,color:C.ink,...F}}>{maskName(c.name)}</div><div style={{fontSize:11,color:C.stone,...F}}>Seviye {b.level} · {b.badge} · aylık skor {b.score}</div></div><Pill bg={i<3?C.mint:C.foam} color={i<3?C.emerald:C.stone}>#{i+1}</Pill></div>})}
        </Card>
        <div style={{fontSize:13,fontWeight:700,color:C.ink,margin:"16px 0 10px",...F}}>Görev Hareketleri</div>
        <Card style={{padding:"4px 14px"}}>
          {logs.length===0?<div style={{padding:"14px 0",fontSize:12,color:C.stone,...F}}>Henüz görev hareketi yok.</div>:logs.map((l,i)=>{
            const client=clients.find(c=>c.id===l.clientId);
            const label=l.action==="completed"?"tamamladı":l.action==="photo_uploaded"?"kanıt ekledi":l.action==="snoozed"?"erteledi":"güncelledi";
            return <div key={l.id} style={{padding:"11px 0",borderBottom:i<logs.length-1?`1px solid ${C.foam}`:"none",display:"flex",gap:10,alignItems:"center"}}><Av ini={ini(client?.name)} size={30}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:800,color:C.ink,...F}}>{client?.name||"Danışan"} {label}</div><div style={{fontSize:11,color:C.stone,...F}}>{l.taskTitle} · {l.time}{l.minutes?` · ${l.minutes} dk`:""}</div></div></div>;
          })}
        </Card>
        <div style={{height:16}}/>
      </div>
    </div>
  );
};
// ── CLIENT SCREENS ──
const ClientHome=({user,onNav,allUsers})=>{
  const freshUser=DB.users().find(u=>u.id===user.id)||user;
  user=freshUser;
  const anim=useAnim(user.id);
  const taskPlan=currentClientTasks(user);
  const homeDay=dailyStateFor(user,taskPlan);
  const {done,pct,body,delta,deltaLabel,elapsed,milestone,isGain}=getClientDashboardSummary({
    client:user,
    taskPlan,
    dailyState:homeDay,
    clientStartAt,
  });
  return(
    <div style={{flex:1,overflow:"hidden",background:C.mist,position:"relative"}}>
      <div style={{padding:"12px 18px 8px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",left:-120,top:-130,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(126,218,38,.2),rgba(255,255,255,0) 64%)",pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,position:"relative"}}>
          <div style={{width:66,height:42,borderRadius:0,background:"transparent",boxShadow:"none",border:"none",display:"flex",alignItems:"center",justifyContent:"center",overflow:"visible"}}>
            <SWPMonogram width={58} height={34} flat variant="wide"/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,color:"#667985",fontWeight:800,...F}}>Günaydın</div>
            <div style={{fontSize:21,fontWeight:950,color:"#14252b",lineHeight:1.1,...F}}>{user.name.split(" ")[0]}</div>
          </div>
          <Avatar user={user} size={56} bg="#e9faef" fg={C.emerald}/>
        </div>
        <div style={{background:"linear-gradient(135deg,rgba(8,55,40,.97),rgba(0,105,63,.9) 58%,rgba(114,212,29,.82))",borderRadius:22,padding:"16px 18px 14px",boxShadow:"0 18px 34px rgba(11,92,55,.22)",border:"1px solid rgba(255,255,255,.18)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-34,bottom:-42,width:150,height:150,borderRadius:"50%",border:"1px solid rgba(255,255,255,.16)"}}/>
          <div style={{fontSize:10,color:"rgba(255,255,255,.75)",fontWeight:900,letterSpacing:.8,marginBottom:8,...F}}>BUGÜNKÜ İLERLEMEN</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:10}}>
            <div><div style={{fontSize:34,fontWeight:950,color:C.white,lineHeight:1,...F}}>{Math.round(anim*pct)}<span style={{fontSize:17}}>%</span></div><div style={{fontSize:11,color:"rgba(255,255,255,.72)",fontWeight:700,...F}}>{done}/{taskPlan.length} görev</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:10,color:"rgba(255,255,255,.72)",marginBottom:3,fontWeight:800,...F}}>Seri</div><div style={{fontSize:27,fontWeight:950,color:"#c7ff5c",lineHeight:1,...F}}>4</div><div style={{fontSize:10,color:"rgba(255,255,255,.72)",fontWeight:700,...F}}>gün</div></div>
          </div>
          <div style={{height:7,background:"rgba(255,255,255,.18)",borderRadius:999,overflow:"hidden"}}>
            <div style={{width:`${anim*pct}%`,height:"100%",background:"linear-gradient(90deg,#ffffff,#c8ff55)",borderRadius:999,transition:"width .05s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",gap:10,marginTop:10,fontSize:10,color:"rgba(255,255,255,.78)",fontWeight:700,...F}}><span>Başlangıç: {new Date(clientStartAt(user)).toLocaleDateString("tr")}</span><span>{elapsed} gün · {delta>0?`${delta} kg gitti`:delta<0?`${Math.abs(delta)} kg alındı`:"0 kg"}</span></div>
        </div>
      </div>
      <div style={{padding:"10px 16px 0"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          {[{l:"Başlangıç",v:dashboardWeightText(body.start),c:C.ink},{l:"Güncel",v:dashboardWeightText(body.current),c:C.emerald},{l:"Hedef",v:dashboardWeightText(body.target),c:C.blue},{l:"Değişim",v:delta>0?`-${delta} kg`:delta<0?`+${Math.abs(delta)} kg`:"0 kg",c:delta>=0?C.jade:C.warn}].map((m,i)=>(
            <Card key={i} style={{padding:"9px 12px",minHeight:52,display:"flex",flexDirection:"column",justifyContent:"center",borderRadius:18}}>
              <div style={{fontSize:11,color:C.stone,marginBottom:3,...F}}>{m.l}</div>
              <div style={{fontSize:20,fontWeight:950,color:m.c,lineHeight:1.05,...F}}>{m.v}</div>
            </Card>
          ))}
        </div>
        {milestone>0&&<Card style={{padding:"12px 14px",marginBottom:8,textAlign:"center",background:`linear-gradient(135deg,${C.gold},#fff4c2)`,border:"none",borderRadius:20,position:"relative"}}>
          <div style={{fontSize:26,marginBottom:2}}>🏆</div>
          <div style={{fontSize:18,fontWeight:950,color:C.ink,marginBottom:4,...F}}>Tebrikler!</div>
          <div style={{fontSize:13,fontWeight:900,color:C.ink,lineHeight:1.3,...F}}>{isGain?`${elapsed} günde ${deltaLabel} kilo aldın.`:`${elapsed} günde ${deltaLabel} kilo gitti.`}</div>
          <div style={{fontSize:12,color:C.emerald,marginTop:4,lineHeight:1.25,...F}}>{isGain?"Sağlıklı artış çok iyi ilerliyor.":`${deltaLabel} kilo eridi bile. Harika gidiyorsun.`}</div>
        </Card>}
      </div>
    </div>
  );
};

const ClientTasks=({user,onUpdate})=>{
  if(!hasAssignedProgram(user)){
    return <div style={{flex:1,overflowY:"auto",background:C.mist,padding:"28px 20px"}}><div style={{fontSize:11,color:C.stone,fontWeight:800,letterSpacing:.5,...F}}>GÖREVLER</div><div style={{fontSize:24,fontWeight:900,color:C.ink,marginBottom:18,...F}}>Bugün</div><Card style={{padding:"18px",border:`1.5px solid ${C.mint}`}}><div style={{fontSize:15,fontWeight:900,color:C.ink,marginBottom:6,...F}}>Henüz program atanmadı</div><div style={{fontSize:12,color:C.stone,lineHeight:1.45,...F}}>Koçun program atadığında günlük görevlerin, zorunlu fotoğraf alanların ve alarmların burada görünecek.</div></Card></div>;
  }
  const template=user.programDraft||getTemplateByClient(user);
  const tasks=currentClientTasks(user);
  const initialDay=dailyStateFor(user,tasks);
  const [checks,setChecks]=useState(initialDay.tasks);
  const [pm,setPm]=useState(null);
  const [note,setNote]=useState(initialDay.note||"");
  const [proofs,setProofs]=useState(initialDay.photoProofs||{});
  const [previewProof,setPreviewProof]=useState(null);
  const [snoozed,setSnoozed]=useState(initialDay.snoozedTasks||{});
  const [reminderInfo,setReminderInfo]=useState("");
  const [tick,setTick]=useState(Date.now());
  const cameraRef=useRef(null);
  const snoozeUsed=(i)=>typeof snoozed[i]==="object"?(snoozed[i].used||0):(Number(snoozed[i])||0);
  const snoozeRemaining=(i)=>Math.max(0,60-snoozeUsed(i));
  const isOverdue=(t,i)=>isTaskOverdue(t,checks[i],snoozed,i);
  const overdue=tasks.map((t,i)=>({...t,idx:i})).find((t)=>isOverdue(t,t.idx));
  const save=(n)=>{
    const state={date:todayKey(),tasks:n,photoProofs:proofs,snoozedTasks:snoozed,note};
    const next=mergeDailyUser(user,tasks,state);
    DB.setUsers(DB.users().map(u=>u.id===user.id?next:u));
    onUpdate(next);
  };
  const addLog=(task,action,extra={})=>{if(isProductionMode()&&user.supabaseToken){createCloudTaskLog({clientId:user.id,coachId:user.coachId,action,proofUrl:extra.url,proofStatus:extra.status,note:extra.note||note},user.supabaseToken).catch(err=>console.warn("cloud-task-log",err));}DB.setTaskLogs([{id:"log"+Date.now(),clientId:user.id,coachId:user.coachId,taskTitle:task.l,action,time:new Date().toLocaleTimeString("tr",{hour:"2-digit",minute:"2-digit"}),date:todayKey(),...extra},...DB.taskLogs()].slice(0,120));};
  const syncDailyStatus=(i,completed,extra={})=>{
    if(!isProductionMode()||!user.supabaseToken)return;
    const t=tasks[i]||{};
    upsertCloudDailyTaskStatus({
      clientId:user.id,
      coachId:user.coachId,
      taskIndex:i,
      taskTitle:t.l||t.title,
      taskDate:todayKey(),
      completed,
      proofUrl:extra.url,
      proofStatus:extra.status,
      snoozeUsed:snoozeUsed(i),
      nextAlarm:snoozed[i]?.nextAlarm,
      note:extra.note||note,
    },user.supabaseToken).catch(err=>console.warn("cloud-daily-task",err));
  };
  const toggle=(i)=>{if(!checks[i]&&tasks[i].photo&&!proofs[i]){setPm(i);return;}const n=[...checks];n[i]=!n[i];setChecks(n);addLog(tasks[i],n[i]?"completed":"reopened",{note});syncDailyStatus(i,n[i],{note});if(n[i])cancelNativeAlarm(tasks[i].idx??i);scheduleNativeAlarms(tasks,n,snoozed);save(n);setNote("");};
  const addProof=async(i,file)=>{
    const source="Kamera",proofId=`proof-${user.id}-${todayKey()}-${i}-${Date.now()}`;
    const mediaId=`photo-${proofId}`;
    const stored=await persistMedia({id:mediaId,file,mediaType:"task_photo",owner:user,clientId:user.id});
    const proof={id:proofId,...stored,source,time:new Date().toLocaleTimeString("tr",{hour:"2-digit",minute:"2-digit"}),date:todayKey(),fileName:file?.name||"kamera-fotografi.jpg",status:"pending",note};
    const nextProofs={...proofs,[i]:proof};
    const n=[...checks];n[i]=true;
    const state={date:todayKey(),tasks:n,photoProofs:nextProofs,snoozedTasks:snoozed,note};
    setProofs(nextProofs);setChecks(n);cancelNativeAlarm(tasks[i].idx??i);scheduleNativeAlarms(tasks,n,snoozed);
    addLog(tasks[i],"photo_uploaded",{proofId,source,note,mediaId:stored.mediaId,url:stored.url,status:"pending"});
    syncDailyStatus(i,true,{note,url:stored.url,status:"pending"});
    const next=mergeDailyUser(user,tasks,state);DB.setUsers(DB.users().map(u=>u.id===user.id?next:u));onUpdate(next);setPm(null);setNote("");
  };
  const onCamera=async(e)=>{const file=e.target.files?.[0];if(!file||pm===null)return;try{await addProof(pm,file);}catch{alert("Fotoğraf kaydedilemedi. Lütfen tekrar dene.");}e.target.value="";};
  const snooze=(i,minutes)=>{const use=Math.min(minutes,snoozeRemaining(i));if(use<=0)return;const base=new Date();base.setMinutes(base.getMinutes()+use);const nextAlarm=base.toTimeString().slice(0,5);const nextSnoozed={...snoozed,[i]:{used:snoozeUsed(i)+use,nextAlarm}};const state={date:todayKey(),tasks:checks,photoProofs:proofs,snoozedTasks:nextSnoozed,note};setSnoozed(nextSnoozed);scheduleNativeAlarms(tasks,checks,nextSnoozed);addLog(tasks[i],"snoozed",{minutes:use});if(isProductionMode()&&user.supabaseToken){const t=tasks[i]||{};upsertCloudDailyTaskStatus({clientId:user.id,coachId:user.coachId,taskIndex:i,taskTitle:t.l||t.title,taskDate:todayKey(),completed:checks[i],snoozeUsed:snoozeUsed(i)+use,nextAlarm,note},user.supabaseToken).catch(err=>console.warn("cloud-snooze",err));}const next=mergeDailyUser(user,tasks,state);DB.setUsers(DB.users().map(u=>u.id===user.id?next:u));onUpdate(next);};
  const enableReminders=async()=>{
    const pendingTasks=tasks.filter((_,i)=>!checks[i]);
    const count=await scheduleInAppReminders(pendingTasks);
    const exact=canUseExactNativeAlarms();
    const fullScreen=canUseFullScreenNativeAlarms();
    const warnings=reminderPermissionWarnings({exact,fullScreen}).join(" ");
    setReminderInfo(count?`${count} aktif görev alarmı kuruldu.${warnings?` ${warnings}`:""}`:"Bildirim izni verilmedi veya uygun saat yok");
    if(!exact)try{window.StepWiseNative?.openExactAlarmSettings?.();}catch{}
    else if(!fullScreen)try{window.StepWiseNative?.openFullScreenIntentSettings?.();}catch{}
  };
  useEffect(()=>{const id=setInterval(()=>setTick(Date.now()),30000);return()=>clearInterval(id);},[]);
  useEffect(()=>{scheduleNativeAlarms(tasks,checks,snoozed);},[user.id,template.name]);
  useEffect(()=>{if(overdue)playAlarmTone();},[tick,overdue?.idx]);
  const done=checks.filter(Boolean).length;const pct=Math.round((done/(tasks.length||1))*100);
  const visibleTasks=tasks.map((t,i)=>({t,i})).filter(({i})=>!checks[i]);
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:C.mist,position:"relative"}}>
      {previewProof&&<ImageLightbox media={previewProof.media} title={previewProof.title} subtitle={previewProof.subtitle} onClose={()=>setPreviewProof(null)}/>}
      {pm!==null&&<div style={{position:"absolute",inset:0,background:"rgba(10,31,22,.75)",display:"flex",alignItems:"flex-end",zIndex:100}}>
        <div style={{background:C.white,borderRadius:"24px 24px 0 0",padding:"20px 24px 32px",width:"100%",boxSizing:"border-box"}}>
          <div style={{width:40,height:4,background:C.pebble,borderRadius:2,margin:"0 auto 20px"}}/>
          <div style={{fontSize:16,fontWeight:800,color:C.ink,marginBottom:4,...F}}>Kanıt Fotoğrafı</div>
          <div style={{fontSize:13,color:C.stone,marginBottom:12,...F}}><b style={{color:C.emerald}}>{tasks[pm].l}</b> için kameradan gerçek fotoğraf çek</div>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Not ekle..." style={{width:"100%",minHeight:64,boxSizing:"border-box",border:`1.5px solid ${C.mint}`,borderRadius:14,padding:"10px 12px",fontSize:13,outline:"none",resize:"vertical",color:C.ink,marginBottom:12,...F}}/>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onCamera} style={{display:"none"}}/>
          <div style={{display:"flex",gap:10,marginBottom:16}}>
            <button onClick={()=>cameraRef.current?.click()}
              style={{flex:1,background:`linear-gradient(135deg,${C.emerald},${C.forest})`,border:"none",borderRadius:16,padding:"16px 0",color:C.white,display:"flex",flexDirection:"column",alignItems:"center",gap:8,cursor:"pointer"}}>
              <Ico d={IC.cam} size={24} color={C.white}/>
              <span style={{fontSize:13,fontWeight:700,...F}}>Kamerayı Aç</span>
            </button>
          </div>
          <button onClick={()=>setPm(null)} style={{width:"100%",background:"none",border:"none",padding:"12px",color:C.stone,fontSize:13,cursor:"pointer",...F}}>Vazgeç</button>
        </div>
      </div>}
      <div style={{background:"rgba(255,255,255,.74)",padding:"8px 20px 16px",backdropFilter:"blur(14px)",borderBottom:"1px solid rgba(255,255,255,.78)"}}>
        <div style={{fontSize:11,color:C.stone,fontWeight:600,letterSpacing:.5,...F}}>GÖREVLER</div>
        <div style={{fontSize:22,fontWeight:800,color:C.ink,marginBottom:4,...F}}>Bugün</div>
        <div style={{fontSize:12,color:C.stone,marginBottom:12,...F}}>{template.name} akışın</div>
        <div style={{background:`linear-gradient(135deg,${C.emerald},${C.forest})`,borderRadius:16,padding:"14px 18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:13,color:"rgba(255,255,255,.75)",fontWeight:600,...F}}>İlerleme</span>
            <span style={{fontSize:16,fontWeight:800,color:C.white,...F}}>{done}/{tasks.length}</span>
          </div>
          <div style={{height:6,background:"rgba(255,255,255,.2)",borderRadius:3,overflow:"hidden"}}>
            <div style={{width:`${pct}%`,height:"100%",background:C.gold,borderRadius:3,transition:"width .4s"}}/>
          </div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
        <div style={{background:"#fff8ec",border:`1.5px solid #ffe0a0`,borderRadius:14,padding:"10px 14px",marginBottom:14,display:"flex",gap:8,alignItems:"flex-start"}}>
          <Ico d={IC.alarm} size={16} color={C.warn}/><div style={{fontSize:12,color:"#a07000",display:"grid",gap:3,...F}}>{visibleTasks.slice(0,3).map(({t})=><div key={`${t.idx}-${t.l}`}>{t.alarm} · {t.l}</div>)}</div>
        </div>
        <button onClick={enableReminders} style={{width:"100%",border:"none",background:C.mint,color:C.emerald,borderRadius:14,padding:"10px 12px",fontSize:12,fontWeight:800,marginBottom:10,...F}}>Bugünkü Hatırlatmaları Aç</button>
        {reminderInfo&&<div style={{fontSize:11,color:C.stone,margin:"-4px 0 10px",textAlign:"center",...F}}>{reminderInfo}</div>}
        {overdue&&<div style={{background:"#fde8e6",border:"1.5px solid #f7b4ac",borderRadius:14,padding:"11px 14px",marginBottom:12,color:C.risk,fontSize:12,fontWeight:800,lineHeight:1.35,...F}}>Hatırlatma: {overdue.l} süresi geçti. Görevi tamamlayabilir veya kalan erteleme hakkını kullanabilirsin.</div>}
        {visibleTasks.length===0&&<Card style={{padding:"18px",marginBottom:12,border:`1.5px solid ${C.jade}`,textAlign:"center"}}><div style={{fontSize:18,fontWeight:900,color:C.emerald,marginBottom:6,...F}}>Bugünkü görevlerin tamamlandı</div><div style={{fontSize:12,color:C.stone,lineHeight:1.45,...F}}>Tüm görevler kaydedildi. Yarın liste otomatik sıfırlanacak.</div></Card>}
        {visibleTasks.map(({t,i})=>(
          <div key={i} style={{background:C.white,borderRadius:18,marginBottom:10,border:`1.5px solid ${checks[i]?C.jade:"rgba(13,61,43,.06)"}`,boxShadow:checks[i]?"0 2px 12px rgba(37,168,116,.1)":"0 1px 4px rgba(13,61,43,.04)"}}>
            <div style={{padding:"14px 16px",display:"flex",gap:12,alignItems:"flex-start",flexWrap:"wrap"}}>
              <div onClick={()=>toggle(i)} style={{width:26,height:26,borderRadius:8,flexShrink:0,background:checks[i]?C.jade:"transparent",border:`2px solid ${checks[i]?C.jade:C.pebble}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .2s"}}>
                {checks[i]&&<Ico d={IC.check} size={14} color={C.white} stroke={2.5}/>}
              </div>
              <div style={{width:36,height:36,borderRadius:12,background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ico d={IC.alarm} size={16} color={t.c}/></div>
              <div style={{flex:"1 1 calc(100% - 86px)",minWidth:0}}>
                <div style={{fontSize:13.5,fontWeight:700,color:checks[i]?C.stone:C.ink,textDecoration:checks[i]?"line-through":"none",...F}}>{t.l}</div>
                <div style={{fontSize:11,color:C.stone,marginTop:2,display:"flex",alignItems:"center",gap:4,flexWrap:"wrap",...F}}><Ico d={IC.alarm} size={11} color={C.stone}/>{t.alarm}<span>· {t.section}</span>{proofs[i]&&<span style={{color:proofs[i].status==="approved"?C.emerald:proofs[i].status==="rejected"?C.risk:C.warn}}>· {proofs[i].status==="approved"?"onaylandı":proofs[i].status==="rejected"?"reddedildi":"onay bekliyor"} {proofs[i].time}</span>}{snoozeUsed(i)>0&&<span style={{color:C.warn}}>· {snoozeUsed(i)} dk ertelendi · {snoozeRemaining(i)} dk kaldı</span>}</div>
                {measuresOf(t.note).length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8}}>{measuresOf(t.note).map(m=><span key={m} style={{fontSize:10,fontWeight:900,color:C.emerald,background:C.foam,border:`1px solid ${C.mint}`,borderRadius:999,padding:"4px 7px",...F}}>{m}</span>)}</div>}
                {t.note&&<div style={{fontSize:11,color:C.emerald,background:C.mint,borderRadius:10,padding:"7px 9px",marginTop:8,lineHeight:1.35,...F}}>{t.note}</div>}
                {t.productImage&&<img src={t.productImage} alt="" style={{width:58,height:46,objectFit:"cover",borderRadius:10,marginTop:8,border:`1px solid ${C.mint}`}}/>}
                {hasMediaImage(proofs[i])&&<button onClick={()=>setPreviewProof({media:proofs[i],title:t.l,subtitle:`${proofs[i].status==="approved"?"Onaylandı":proofs[i].status==="rejected"?"Reddedildi":"Onay bekliyor"} · ${proofs[i].time||""}`})} style={{border:"none",background:"transparent",padding:0,display:"block",marginTop:8,cursor:"pointer",borderRadius:10,overflow:"hidden",width:58,height:46}}><MediaImage media={proofs[i]} alt="Görev fotoğrafı" style={{width:"100%",height:"100%",objectFit:"cover",display:"block",border:`1px solid ${C.mint}`}}/></button>}
              </div>
              <div style={{width:"100%",display:"flex",justifyContent:"flex-end",gap:8,paddingLeft:74,boxSizing:"border-box"}}>
                {!checks[i]&&t.photo&&<button onClick={()=>setPm(i)} style={{background:C.blueBg,border:"none",borderRadius:10,padding:"6px 10px",color:C.blue,fontSize:11,fontWeight:700,cursor:"pointer",...F}}>Fotoğraf</button>}
                {!checks[i]&&t.snoozeEnabled&&snoozeRemaining(i)>0&&[15,30,60].filter(m=>m<=snoozeRemaining(i)).concat(snoozeRemaining(i)<60&&![15,30,60].includes(snoozeRemaining(i))?[snoozeRemaining(i)]:[]).slice(0,3).map(m=><button key={m} onClick={()=>snooze(i,m)} style={{background:"#fff4e0",border:"none",borderRadius:10,padding:"6px 9px",color:C.warn,fontSize:11,fontWeight:700,cursor:"pointer",...F}}>+{m} dk</button>)}
              </div>
            </div>
          </div>
        ))}
        <Card style={{padding:"14px",marginTop:6}}>
          <div style={{fontSize:13,fontWeight:800,color:C.ink,marginBottom:8,...F}}>Bugünkü Not</div>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Görev tamamlarken kaydedilecek kısa not..." style={{width:"100%",minHeight:58,boxSizing:"border-box",border:`1.5px solid ${C.mint}`,borderRadius:14,padding:"10px 12px",fontSize:13,outline:"none",resize:"vertical",color:C.ink,...F}}/>
        </Card>
        <div style={{height:16}}/>
      </div>
    </div>
  );
};

const ClientMsgs=({user,allUsers})=>{
  const [msg,setMsg]=useState("");const [mediaOpen,setMediaOpen]=useState(false);const [,forceUpdate]=useState(0);
  const coach=DB.users().find(u=>u.id===user.coachId)||allUsers.find(u=>u.id===user.coachId);const ref=useRef();const photoRef=useRef(null);const recRef=useRef(null);const chunksRef=useRef([]);const [recording,setRecording]=useState(false);const [voiceDraft,setVoiceDraft]=useState(null);const [recordSeconds,setRecordSeconds]=useState(0);
  const coachEnabled=coach?.clientMessagesOpen!==false;const canSend=coachEnabled;
  const msgs=()=>conversationBetween(DB.msgs(),user.id,user.coachId);
  const pushMsg=async(extra)=>{if(!canSend)return;const record=await createMessageRecord({user,to:user.coachId,extra,logLabel:"cloud-client-message"});DB.setMsgs([...DB.msgs(),record]);forceUpdate(n=>n+1);};
  const send=()=>{if(!msg.trim()||!canSend)return;pushMsg({text:msg.trim(),kind:"text"});setMsg("");};
  const sendFile=async(e,kind)=>{const file=e.target.files?.[0];if(!file||!canSend)return;try{pushMsg(await createMediaMessageDraft({kind,file,user,clientId:user.id,idPrefix:"msg"}));}catch{alert("Medya kaydedilemedi. Lütfen tekrar dene.");}e.target.value="";};
  const startRecord=async(e)=>{e?.preventDefault?.();if(!canSend||recording)return;setVoiceDraft(null);try{if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined"){alert("Bu cihazda mikrofon kaydı desteklenmiyor.");return;}const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});const rec=new MediaRecorder(stream);chunksRef.current=[];rec.ondataavailable=e=>e.data.size&&chunksRef.current.push(e.data);rec.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunksRef.current,{type:rec.mimeType||"audio/webm"});if(blob.size<900){setRecording(false);return;}const reader=new FileReader();reader.onload=()=>setVoiceDraft({url:reader.result,blob,name:"sesli-mesaj.webm"});reader.readAsDataURL(blob);setRecording(false);};recRef.current=rec;rec.start();setRecording(true);}catch(err){console.warn("voice-record-error",err);setRecording(false);alert("Mikrofon izni verilemedi. Android ayarlarından mikrofon iznini kontrol et.");}};
  const stopRecord=()=>{if(recording)recRef.current?.stop();};
  const sendVoiceDraft=async()=>{if(!voiceDraft)return;try{pushMsg(await createMediaMessageDraft({kind:"audio",file:voiceDraft.blob,user,clientId:user.id,idPrefix:"msg",name:voiceDraft.name}));setVoiceDraft(null);}catch{alert("Sesli mesaj kaydedilemedi.");}};
  const deleteVoiceDraft=()=>setVoiceDraft(null);
  const renderMsg=(m,isMe)=><><div>{m.kind==="photo"&&(m.url||m.mediaId)?<MediaImage media={m} alt="" style={{width:170,maxWidth:"100%",borderRadius:12,display:"block",marginBottom:6}}/>:m.kind==="audio"&&(m.url||m.mediaId)?<MediaAudio media={m} style={{width:190,maxWidth:"100%"}}/>:m.text}</div><div style={{fontSize:10,opacity:.55,marginTop:4,textAlign:"right"}}>{m.time}</div></>;
  useEffect(()=>ref.current?.scrollIntoView({behavior:"smooth"}),[msg]);
  useEffect(()=>{if(!recording){setRecordSeconds(0);return;}const started=Date.now();const timer=setInterval(()=>setRecordSeconds(Math.floor((Date.now()-started)/1000)),250);return()=>clearInterval(timer);},[recording]);
  useEffect(()=>{syncConversationRead({markLocalRead:markMessagesRead,user,fromId:user.coachId,logLabel:"cloud-client-read"}).then(changed=>changed&&forceUpdate(n=>n+1));},[user.id,user.coachId]);
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:C.mist,position:"relative"}}>
      <div style={{background:"rgba(255,255,255,.74)",padding:"8px 20px 16px",borderBottom:"1px solid rgba(255,255,255,.78)",backdropFilter:"blur(14px)"}}>
        <div style={{fontSize:11,color:C.stone,fontWeight:600,letterSpacing:.5,marginBottom:12,...F}}>KOÇUM</div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <div style={{position:"relative"}}>
            <Av ini={ini(coach?.name)} size={46} bg={C.forest} fg={C.white}/>
            <div style={{position:"absolute",bottom:1,right:1,width:12,height:12,background:"#25d48a",borderRadius:"50%",border:`2px solid ${C.white}`}}/>
          </div>
          <div><div style={{fontSize:16,fontWeight:800,color:C.ink,...F}}>{coach?.name||"Koçun"}</div><div style={{fontSize:11,color:"#25d48a",fontWeight:600,...F}}>● Çevrimiçi</div></div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
        {msgs().map((m,i)=>{const isMe=m.from===user.id;return(
          <div key={i} style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",alignItems:"flex-end",gap:8}}>
            {!isMe&&<Av ini={ini(coach?.name)} size={26} bg={C.forest} fg={C.white}/>}
            <div style={{background:isMe?C.emerald:C.white,color:isMe?C.white:C.ink,borderRadius:isMe?"20px 20px 4px 20px":"20px 20px 20px 4px",padding:"10px 14px",maxWidth:"74%",fontSize:13,lineHeight:1.5,boxShadow:"0 1px 6px rgba(13,61,43,.08)",...F}}>
              {renderMsg(m,isMe)}
            </div>
            {isMe&&<Av ini={ini(user.name)} size={26} bg={C.emerald} fg={C.white}/>}
          </div>
        );})}<div ref={ref}/>
      </div>
      <div style={{padding:"10px 16px 12px",background:C.white,borderTop:`1px solid ${C.mint}`}}>
        <input ref={photoRef} type="file" accept="image/*" onChange={e=>sendFile(e,"photo")} style={{display:"none"}}/>
        {!coachEnabled&&<div style={{fontSize:11,color:C.risk,fontWeight:800,marginBottom:8,...F}}>Koçun mesaj göndermeyi geçici olarak kapattı.</div>}
        {recording&&<div style={{display:"flex",alignItems:"center",gap:10,background:"#fff8f7",border:`1px solid #ffd4d0`,borderRadius:16,padding:"9px 10px",marginBottom:8,boxShadow:"0 8px 22px rgba(217,79,61,.10)"}}><span style={{width:10,height:10,borderRadius:"50%",background:C.risk,boxShadow:`0 0 0 6px rgba(217,79,61,.12)`,flexShrink:0}}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:900,color:C.risk,...F}}>Ses kaydı alınıyor</div><div style={{fontSize:11,color:C.stone,...F}}>Bitirmek için mikrofona veya Bitir'e bas.</div></div><div style={{fontSize:13,fontWeight:900,color:C.ink,minWidth:42,textAlign:"right",...F}}>{fmtDuration(recordSeconds)}</div><button onClick={stopRecord} style={{border:"none",background:C.risk,color:C.white,borderRadius:11,padding:"8px 10px",fontSize:11,fontWeight:900,...F}}>Bitir</button></div>}
        {voiceDraft&&<div style={{display:"flex",alignItems:"center",gap:8,background:C.foam,border:`1px solid ${C.mint}`,borderRadius:16,padding:"8px 10px",marginBottom:8}}><audio src={voiceDraft.url} controls style={{flex:1,height:32}}/><button onClick={deleteVoiceDraft} style={{border:"none",background:"#fde8e6",color:C.risk,borderRadius:10,padding:"8px 10px",fontSize:11,fontWeight:900,...F}}>Sil</button><button onClick={sendVoiceDraft} style={{border:"none",background:C.emerald,color:C.white,borderRadius:10,padding:"8px 10px",fontSize:11,fontWeight:900,...F}}>Gönder</button></div>}
        {mediaOpen&&<div style={{display:"flex",gap:8,alignItems:"center",background:C.white,border:`1px solid ${C.mint}`,borderRadius:16,padding:"8px",marginBottom:8,boxShadow:"0 8px 20px rgba(13,61,43,.08)"}}><button disabled={!canSend} onClick={()=>{setMediaOpen(false);photoRef.current?.click();}} style={{border:"none",background:C.blueBg,color:C.blue,borderRadius:12,padding:"9px 12px",fontSize:12,fontWeight:900,display:"flex",alignItems:"center",gap:6,...F}}><Ico d={IC.cam} size={16} color={C.blue}/>Fotoğraf ekle</button></div>}
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <button disabled={!canSend} onClick={()=>setMediaOpen(v=>!v)} style={{width:42,height:42,border:"none",background:C.foam,color:canSend?C.emerald:C.stone,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",...F}}><Ico d={IC.plus} size={18} color={canSend?C.emerald:C.stone}/></button>
          <button disabled={!canSend} onClick={recording?stopRecord:startRecord} style={{width:42,height:42,border:"none",background:recording?"#fde8e6":canSend?C.mint:C.foam,color:recording?C.risk:canSend?C.emerald:C.stone,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",...F}}><Ico d={IC.mic} size={18} color={recording?C.risk:canSend?C.emerald:C.stone}/></button>
          <div style={inputShellStyle()}>
            <input disabled={!canSend} value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={canSend?"Koçuna yaz...":"Mesaj kapalı"} style={{border:"none",background:"none",outline:"none",fontSize:13,color:C.ink,width:"100%",...F}}/>
          </div>
          <button disabled={!canSend} onClick={send} style={{width:44,height:44,borderRadius:16,background:canSend?C.emerald:C.pebble,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:canSend?"pointer":"default",boxShadow:canSend?`0 4px 12px rgba(26,102,69,.35)`:"none"}}><Ico d={IC.send} size={18} color={C.white}/></button>
        </div>
      </div>
    </div>
  );
};

const ClientProgress=({user,allUsers})=>{
  const anim=useAnim(user.id);
  const compliance=Number(user.compliance)||0;
  const weekly=Number(user.weeklyAverage)||0;
  const bars=clientProgressBars({compliance,weekly});
  const body=clientProgressBody(user.body);
  const clients=topClientProgressClients(allUsers);
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:C.mist}}>
      <div style={{background:"rgba(255,255,255,.74)",padding:"8px 20px 16px",backdropFilter:"blur(14px)",borderBottom:"1px solid rgba(255,255,255,.78)"}}>
        <div style={{fontSize:11,color:C.stone,fontWeight:600,letterSpacing:.5,...F}}>İLERLEME</div>
        <div style={{fontSize:22,fontWeight:800,color:C.ink,...F}}>Performansım</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
        <Card style={{padding:"16px",marginBottom:16,background:`linear-gradient(135deg,${C.emerald},${C.forest})`}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,.65)",fontWeight:600,letterSpacing:.5,marginBottom:8,...F}}>GENEL UYUM</div>
          <div style={{fontSize:44,fontWeight:800,color:C.white,...F}}>{Math.round(anim*compliance)}<span style={{fontSize:22}}>%</span></div>
          <div style={{height:8,background:"rgba(255,255,255,.2)",borderRadius:4,overflow:"hidden",marginTop:12}}>
            <div style={{width:`${anim*compliance}%`,height:"100%",background:C.gold,borderRadius:4,transition:"width .05s"}}/>
          </div>
        </Card>
        <Card style={{padding:"16px",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:C.ink,marginBottom:14,...F}}>Son 7 günlük uyum</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:6,height:90,marginBottom:8}}>
            {bars.map((v,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",height:"100%",justifyContent:"flex-end"}}><div style={{width:"100%",borderRadius:"4px 4px 0 0",height:`${anim*(v/100)*100}%`,transition:"height .05s",background:v>=70?C.jade:v>=50?C.warn:C.risk}}/></div>)}
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            {["Pt","Sa","Çr","Pr","Cu","Ct","Pz"].map((l,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:9,color:C.stone,...F}}>{l}</div>)}
          </div>
        </Card>
        <Card style={{padding:"16px",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:800,color:C.ink,marginBottom:12,...F}}>Vücut Analizi</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[{l:"Yağ",v:Number(body.fat)>0?`%${body.fat}`:"-"},{l:"Kas",v:Number(body.muscle)>0?`%${body.muscle}`:"-"},{l:"Su",v:Number(body.water)>0?`%${body.water}`:"-"},{l:"Bel",v:Number(body.waist)>0?`${body.waist} cm`:"-"},{l:"Kalça",v:Number(body.hip)>0?`${body.hip} cm`:"-"},{l:"BMI",v:Number(body.bmi)>0?body.bmi:"-"}].map(x=><div key={x.l} style={{background:C.foam,borderRadius:12,padding:"10px"}}><div style={{fontSize:10,color:C.stone,...F}}>{x.l}</div><div style={{fontSize:15,fontWeight:800,color:C.ink,...F}}>{x.v}</div></div>)}
          </div>
        </Card>
        <Card style={{padding:"16px",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:800,color:C.ink,marginBottom:12,...F}}>Aylık Başarı Sıralaması</div>
          {clients.map((c,i)=>{const b=monthlyBadge(c,i);return <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<clients.length-1?`1px solid ${C.foam}`:"none"}}><div style={{fontSize:23,width:30,textAlign:"center"}}>{rankIcon(i)}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:800,color:C.ink,...F}}>{maskName(c.name)} · Seviye {b.level}</div><div style={{fontSize:11,color:C.stone,...F}}>{b.badge} · %{c.compliance||0} uyum</div></div><Pill bg={i<3?C.mint:C.foam} color={i<3?C.emerald:C.stone}>#{i+1}</Pill></div>})}
        </Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{i:"🔥",l:`${user.streakDays||0} Gün Seri`,bg:C.mint},{i:"💧",l:`Su %${body.water}`,bg:"#fff4e0"},{i:"📏",l:`BMI ${body.bmi}`,bg:C.purpleBg},{i:"💪",l:`Kas %${body.muscle}`,bg:C.blueBg}].map((a,i)=>(
            <Card key={i} style={{padding:"14px",background:a.bg,border:"none"}}><div style={{fontSize:26,marginBottom:6}}>{a.i}</div><div style={{fontSize:12,fontWeight:700,color:C.ink,...F}}>{a.l}</div></Card>
          ))}
        </div>
        <div style={{height:16}}/>
      </div>
    </div>
  );
};

const ClientCal=({user,allUsers})=>{
  const today=new Date();
  const todayIso=todayIsoDate(today);
  const [weekOffset,setWeekOffset]=useState(0);
  const dates=weekDateItems(today,weekOffset);
  const [sel,setSel]=useState(todayIso);
  const [requesting,setRequesting]=useState(false);
  const [req,setReq]=useState({date:todayIso,time:"10:00",type:"Görüşme talebi",duration:"30 dk"});
  const [,forceUpdate]=useState(0);
  const days=dates.map(d=>d.label);
  const coach=allUsers.find(u=>u.id===user.coachId);
  const sessions=sessionsForClient(DB.sess(),user.id);
  const daySess=sessionsForDate(sessions,sel);
  const updateSession=async(id,patch)=>{const applied=applySessionPatch(DB.sess(),id,patch);let updated=applied.updated;if(isProductionMode()&&user.supabaseToken){try{updated={...updated,...(await updateCloudAppointment(id,patch,user.supabaseToken)||{})};}catch(err){console.warn("cloud-client-session-update",err);}}DB.setSess(DB.sess().map(s=>s.id===id?updated:s));if(updated.coachId&&patch.status==="confirmed")addNotice(updated.coachId,clientSessionConfirmedNotice(user.name,updated),"session");forceUpdate(n=>n+1);};
  const requestSession=async()=>{if(!coach)return;const draft=buildClientSessionRequest({coachId:coach.id,clientId:user.id,request:req});let saved=draft;if(isProductionMode()&&user.supabaseToken){try{saved=await createCloudAppointment(draft,user.supabaseToken)||draft;}catch(err){console.warn("cloud-client-session",err);}}DB.setSess([...DB.sess(),saved]);addNotice(coach.id,clientSessionRequestNotice(user.name,saved),"session");setSel(saved.date||sel);setRequesting(false);forceUpdate(n=>n+1);};
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:C.mist,position:"relative"}}>
      {requesting&&<div style={{position:"absolute",inset:0,background:"rgba(10,31,22,.72)",zIndex:70,display:"flex",alignItems:"flex-end"}}><div style={{background:C.white,borderRadius:"24px 24px 0 0",padding:"20px",width:"100%",boxSizing:"border-box"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div><div style={{fontSize:18,fontWeight:800,color:C.ink,...F}}>Randevu Talebi</div><div style={{fontSize:12,color:C.stone,...F}}>Koçun onaylarsa takvimde yeşil görünür.</div></div><button onClick={()=>setRequesting(false)} style={buttonStyle({variant:"soft",style:{borderRadius:12,padding:"8px 12px"}})}>Kapat</button></div><div style={{display:"grid",gap:9}}><input value={req.type} onChange={e=>setReq(r=>({...r,type:e.target.value}))} style={controlStyle()}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><input type="date" value={req.date} onChange={e=>setReq(r=>({...r,date:e.target.value}))} style={controlStyle()}/><input type="time" value={req.time} onChange={e=>setReq(r=>({...r,time:e.target.value}))} style={controlStyle()}/></div><select value={req.duration} onChange={e=>setReq(r=>({...r,duration:e.target.value}))} style={controlStyle()}><option>15 dk</option><option>30 dk</option><option>45 dk</option><option>60 dk</option></select><button onClick={requestSession} disabled={!coach} style={buttonStyle({disabled:!coach,style:{width:"100%",borderRadius:15,padding:"13px"}})}>Talebi Gönder</button></div></div></div>}
      <div style={{background:"rgba(255,255,255,.74)",padding:"8px 20px 0",backdropFilter:"blur(14px)",borderBottom:"1px solid rgba(255,255,255,.78)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><div style={{fontSize:11,color:C.stone,fontWeight:600,letterSpacing:.5,...F}}>TAKVİM</div><div style={{fontSize:22,fontWeight:800,color:C.ink,...F}}>Seanslarım</div></div><button onClick={()=>setRequesting(true)} style={{border:"none",background:C.emerald,color:C.white,borderRadius:13,padding:"9px 11px",fontSize:12,fontWeight:800,...F}}>Talep Et</button></div>
        <div style={{display:"grid",gridTemplateColumns:"36px 1fr 36px",gap:8,alignItems:"start",paddingBottom:16}}><button onClick={()=>setWeekOffset(w=>w-1)} style={{height:36,border:"none",borderRadius:12,background:C.foam,color:C.emerald,fontWeight:900}}>‹</button><div style={{display:"flex",justifyContent:"space-between"}}>
          {days.map((d,i)=>{const date=dates[i],has=sessions.some(s=>s.date===date.iso),on=sel===date.iso;return(
            <div key={d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
              <span style={{fontSize:10,color:on?C.emerald:C.stone,fontWeight:on?700:500,...F}}>{d}</span>
              <button onClick={()=>setSel(date.iso)} style={{width:36,height:36,borderRadius:12,border:"none",background:on?C.emerald:"transparent",color:on?C.white:C.ink,fontWeight:on?800:500,fontSize:14,cursor:"pointer",boxShadow:on?`0 4px 10px rgba(26,102,69,.3)`:"none",transition:"all .2s",...F}}>{date.day}</button>
              <div style={{width:4,height:4,borderRadius:"50%",background:has?(on?C.white:C.jade):"transparent"}}/>
            </div>
          );})}
        </div><button onClick={()=>setWeekOffset(w=>w+1)} style={{height:36,border:"none",borderRadius:12,background:C.foam,color:C.emerald,fontWeight:900}}>›</button></div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
        {(user.notifications||[]).filter(n=>!n.read).slice(0,2).map(n=><Card key={n.id} style={{padding:"12px 14px",marginBottom:10,border:`1.5px solid ${C.mint}`,background:C.foam}}><div style={{fontSize:12,fontWeight:900,color:C.emerald,...F}}>{n.text}</div><div style={{fontSize:10,color:C.stone,marginTop:3,...F}}>{n.date} · {n.time}</div></Card>)}
        {coach&&<Card style={{padding:"14px 16px",marginBottom:16,display:"flex",gap:12,alignItems:"center"}}>
          <Av ini={ini(coach.name)} size={42} bg={C.forest} fg={C.white}/>
          <div><div style={{fontSize:14,fontWeight:800,color:C.ink,...F}}>{coach.name}</div><div style={{fontSize:11,color:C.stone,...F}}>Kişisel Koçun</div></div>
        </Card>}
        {daySess.length===0?<div style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:40,marginBottom:12}}>📅</div><div style={{fontSize:14,fontWeight:700,color:C.ink,...F}}>Seans yok</div></div>
        :daySess.map((s,i)=>(
          <Card key={i} style={{padding:"16px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div><div style={{fontSize:15,fontWeight:800,color:C.ink,...F}}>{s.type}</div><div style={{fontSize:12,color:C.emerald,fontWeight:600,marginTop:2,...F}}>{s.time} · {s.duration}</div></div>
              <Pill bg={s.status==="confirmed"?C.mint:s.status==="proposed"?C.blueBg:"#fff4e0"} color={s.status==="confirmed"?C.emerald:s.status==="proposed"?C.blue:C.warn}>{s.status==="confirmed"?"Onaylı":s.status==="proposed"?"Yeni saat":"Bekliyor"}</Pill>
            </div>
            {s.status==="proposed"&&<button onClick={()=>updateSession(s.id,{status:"confirmed",requestedBy:"coach"})} style={{width:"100%",border:"none",background:C.mint,color:C.emerald,borderRadius:12,padding:"10px",fontSize:12,fontWeight:900,...F}}>Bu Saati Kabul Et</button>}
          </Card>
        ))}
      </div>
    </div>
  );
};
const AlarmPermissionCard=()=>{
  const read=()=>({
    exact:canUseExactNativeAlarms(),
    fullScreen:canUseFullScreenNativeAlarms(),
    browser:typeof Notification==="undefined" ? true : Notification.permission==="granted",
  });
  const [status,setStatus]=useState(read);
  const refresh=()=>setStatus(read());
  useEffect(()=>{
    const timer=setInterval(refresh,2500);
    return()=>clearInterval(timer);
  },[]);
  const items=[
    {
      label:"Kesin alarm",
      text:"Görev alarmı cihaz uykudayken de zamanında kurulur.",
      ok:status.exact,
      action:()=>{openExactAlarmSettings();setTimeout(refresh,900);},
    },
    {
      label:"Kilit ekranı alarmı",
      text:"Alarm kilit ekranında daha belirgin açılır.",
      ok:status.fullScreen,
      action:()=>{openFullScreenAlarmSettings();setTimeout(refresh,900);},
    },
    {
      label:"Bildirim izni",
      text:"Mesaj ve görev uyarıları telefon bildirimlerinde görünür.",
      ok:status.browser,
      action:async()=>{
        try{if(typeof Notification!=="undefined")await Notification.requestPermission();}catch{}
        refresh();
      },
    },
  ];
  const allOk=items.every(i=>i.ok);
  return(
    <Card style={{padding:"16px",marginBottom:14,border:`1.5px solid ${allOk?C.mint:"#ffe0a0"}`}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:10}}>
        <div>
          <div style={{fontSize:14,fontWeight:900,color:C.ink,...F}}>Alarm İzinleri</div>
          <div style={{fontSize:11,color:C.stone,marginTop:3,lineHeight:1.35,...F}}>Kilit ekranı ve kapalı ekran alarm güveni</div>
        </div>
        <Pill bg={allOk?C.mint:"#fff4e0"} color={allOk?C.emerald:C.warn}>{allOk?"Hazır":"Kontrol Et"}</Pill>
      </div>
      <div style={{display:"grid",gap:8}}>
        {items.map(item=>(
          <button key={item.label} onClick={item.ok?refresh:item.action} style={{border:`1px solid ${item.ok?C.mint:"#ffe0a0"}`,background:item.ok?"rgba(240,250,245,.9)":"#fffaf0",borderRadius:14,padding:"10px 12px",display:"flex",alignItems:"center",gap:10,textAlign:"left",cursor:"pointer",...F}}>
            <Ico d={item.ok?IC.check:IC.alarm} size={18} color={item.ok?C.emerald:C.warn}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:900,color:C.ink,...F}}>{item.label}</div>
              <div style={{fontSize:10,color:C.stone,lineHeight:1.3,...F}}>{item.text}</div>
            </div>
            <span style={{fontSize:11,fontWeight:900,color:item.ok?C.emerald:C.warn,...F}}>{item.ok?"Açık":"Aç"}</span>
          </button>
        ))}
      </div>
    </Card>
  );
};

// ── ADMIN PANEL ──
const ProfileScreen=({user,allUsers,onUpdate,onLogout})=>{
  user=normalizeUserDefaults(DB.users().find(u=>u.id===user.id)||user||{});
  const isCoach=user.role==="coach";
  const [editing,setEditing]=useState(false);
  const [form,setForm]=useState({name:user.name||"",email:user.email||"",phone:user.phone||""});
  const prefTasks=isCoach?[]:currentClientTasks(user);
  const initialTaskTimes=Object.fromEntries(prefTasks.map(t=>[t.idx,t.alarm||"09:00"]));
  const safeSchedulePrefs=typeof user.schedulePrefs==="object"&&user.schedulePrefs?user.schedulePrefs:{};
  const [prefs,setPrefs]=useState({morningProduct:"08:30",mealPhoto:"09:00",walk:"17:00",...safeSchedulePrefs,taskTimes:{...initialTaskTimes,...(safeSchedulePrefs.taskTimes||{})}});
  const [security,setSecurity]=useState({current:"",next:"",msg:""});
  const [programAdding,setProgramAdding]=useState(false);
  const [programEditing,setProgramEditing]=useState(null);
  const [customProgram,setCustomProgram]=useState({name:"",desc:"",duration:"30 gün",tasks:"",productVideo:null});
  const [videoProgram,setVideoProgram]=useState(null);
  const photoRef=useRef(null);const programVideoRef=useRef(null);const rowVideoRef=useRef(null);
  const clients=isCoach?allUsers.filter(u=>u.role==="client"&&u.coachId===user.id):[];
  const banned=clients.filter(c=>c.status==="banned");
  const activePrograms=clients.filter(hasAssignedProgram);
  const productVideos=isCoach?clients.flatMap(c=>(Array.isArray(c.productVideos)?c.productVideos:[c.productVideoDraft].filter(Boolean)).filter(v=>v?.mediaId||v?.url).map(v=>({client:c,video:v}))):[];
  const saveProfile=async()=>{
    const updated=await resolveProfilePatch({user,patch:{name:form.name.trim()||user.name,email:form.email.trim()||user.email,phone:form.phone.trim()},logLabel:"cloud-profile"});
    DB.setUsers(DB.users().map(u=>u.id===user.id?updated:u));
    saveSession(updated);
    setEditing(false);onUpdate?.(updated);
  };
  const changePhoto=async(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      const mediaId=`avatar-${user.id}-${Date.now()}`;
      const stored=await persistMedia({id:mediaId,file,mediaType:"profile",owner:user,clientId:isCoach?null:user.id});
      if(user.avatarMediaId)await MediaStore.del(user.avatarMediaId);
      const updated=await resolveProfilePatch({user,patch:{avatarUrl:stored.url||"",avatarMediaId:stored.mediaId,avatarMedia:stored,profilePhotoLocked:isCoach?false:true},logLabel:"cloud-avatar"});
      DB.setUsers(DB.users().map(u=>u.id===user.id?updated:u));
      saveSession(updated);
      onUpdate?.(updated);
    }catch{alert("Profil fotoğrafı kaydedilemedi. Lütfen tekrar dene.");}
    e.target.value="";
  };
  const changeCover=async(bg)=>{const updated=await resolveProfilePatch({user,patch:{coverBg:bg},logLabel:"cloud-cover"});DB.setUsers(DB.users().map(u=>u.id===user.id?updated:u));saveSession(updated);onUpdate?.(updated);};
  const savePrefs=async()=>{const updated=await resolveProfilePatch({user,patch:{schedulePrefs:prefs,schedulePrefsLocked:true},logLabel:"cloud-prefs"});DB.setUsers(DB.users().map(u=>u.id===user.id?updated:u));saveSession(updated);onUpdate?.(updated);};
  const changePassword=async()=>{
    if(security.next.length<6){setSecurity(s=>({...s,msg:"Yeni şifre en az 6 karakter olmalı."}));return;}
    const ok=await authUser(user.email,security.current);
    if(!ok){setSecurity(s=>({...s,msg:"Mevcut şifre hatalı."}));return;}
    const updated=await withPassword({...user},security.next);
    DB.setUsers(DB.users().map(u=>u.id===user.id?updated:u));
    saveSession(updated);
    setSecurity({current:"",next:"",msg:"Şifre güncellendi."});
    onUpdate?.(updated);
  };
  const deleteAccount=()=>{
    if(!window.confirm("Hesabın ve yerel verilerin silinecek. Emin misin?"))return;
    DB.setUsers(DB.users().filter(u=>u.id!==user.id).map(u=>user.role==="client"&&u.id===user.coachId?{...u,clients:(u.clients||[]).filter(id=>id!==user.id)}:u));
    onLogout();
  };
  const unban=(id)=>{DB.setUsers(DB.users().map(u=>u.id===id?{...u,status:"active"}:u));onUpdate?.();};
  const saveProgramVideo=async(e)=>{const file=e.target.files?.[0];if(!file)return;try{const mediaId=`program-video-${user.id}-${Date.now()}`;const stored=await persistMedia({id:mediaId,file,mediaType:"product_video",owner:user});setCustomProgram(p=>({...p,productVideo:{...stored,name:file.name||"program-videosu",size:file.size,type:file.type,assignedAt:todayKey(),coachId:user.id}}));}catch{alert("Video kaydedilemedi.");}e.target.value="";};
  const saveProgramRowVideo=async(e)=>{
    const file=e.target.files?.[0],base=videoProgram;if(!file||!base)return;
    try{
      const mediaId=`program-video-${user.id}-${Date.now()}`;
      const stored=await persistMedia({id:mediaId,file,mediaType:"product_video",owner:user});
      const productVideo={...stored,name:file.name||"program-videosu",size:file.size,type:file.type,assignedAt:todayKey(),coachId:user.id};
      const program=base.coachId===user.id?{...base,productVideo}:{...base,id:`cp-${user.id}-${base.id}`,coachId:user.id,variantNote:"Özel",productVideo};
      DB.setPrograms(uniquePrograms([...DB.programs().filter(p=>p.id!==program.id),program]));
      DB.setUsers(DB.users().map(u=>{
        if(u.id===user.id&&base.coachId!==user.id)return {...u,hiddenProgramIds:[...new Set([...(u.hiddenProgramIds||[]),base.id])]};
        if(u.coachId===user.id&&u.programTemplateId===base.id){
          const active=normalizeProgramTasksForCycle(program.tasks||[]).filter(t=>isTaskActiveToday(t,u));
          const assigned=programVideoForAssignment(program);
          return buildAssignedProgramClient({client:u,template:program,activeTasks:active,productVideo:assigned,date:todayKey(),historyLimit:8,keepTaskChecks:true,keepProgress:true});
        }
        return u;
      }));
      onUpdate?.();
    }catch{alert("Video kaydedilemedi.");}
    setVideoProgram(null);e.target.value="";
  };
  const createCustomProgram=async()=>{
    if(!customProgram.name.trim())return;
    const tasks=normalizeProgramTasksForCycle(customProgram.tasks.split("\n").map((line,i)=>{const [title,time,section,note]=line.split("|").map(x=>(x||"").trim());return title?{title,type:"meal",section:section||"Genel",scheduledTime:time||"09:00",repeatType:"daily",repeatDays:[1,2,3,4,5,6,7],buttonLabel:"Fotoğraf Ekle",photoRequired:true,snoozeEnabled:true,snoozeOptions:[15,30,60],note:note||title}:null;}).filter(Boolean));
    const fallback=PROGRAM_TEMPLATES[0].tasks.map(t=>({...t}));
    const p={id:programEditing?.id||"cp"+Date.now(),coachId:user.id,name:customProgram.name.trim(),desc:customProgram.desc.trim()||"Koç tarafından eklenen özel program",duration:customProgram.duration||"30 gün",variantNote:"Özel",bannedFoods:BANNED_FOODS,quickRules:["Koç tarafından oluşturuldu"],cautionNotes:["Program detayları koç kontrolündedir"],tasks:tasks.length?tasks:(programEditing?.tasks||fallback),productVideo:customProgram.productVideo||programEditing?.productVideo||null};
    let saved=p;if(isProductionMode()&&user.supabaseToken){try{saved=(programEditing&&isCloudId(programEditing.id)?await updateCloudProgram(p,user.supabaseToken):await createCloudProgram(p,user.supabaseToken))||p;}catch(err){console.warn("cloud-program",err);}}
    DB.setPrograms(uniquePrograms([...(programEditing?DB.programs().filter(x=>x.id!==programEditing.id):DB.programs()),saved]));
    if(programEditing?.sourceTemplateId){
      const updated={...user,hiddenProgramIds:[...new Set([...(user.hiddenProgramIds||[]),programEditing.sourceTemplateId])]};
      DB.setUsers(DB.users().map(u=>u.id===user.id?updated:u));
      saveSession(updated);
    }
    DB.setUsers(DB.users().map(u=>{
      if(u.programTemplateId!==saved.id)return u;
      const active=normalizeProgramTasksForCycle(saved.tasks).filter(t=>isTaskActiveToday(t,u));
      const programVideo=programVideoForAssignment(saved);
      return buildAssignedProgramClient({client:u,template:saved,activeTasks:active,productVideo:programVideo,date:todayKey(),historyLimit:8,keepTaskChecks:true,keepProgress:true});
    }));
    setProgramAdding(false);setProgramEditing(null);setCustomProgram({name:"",desc:"",duration:"30 gün",tasks:"",productVideo:null});onUpdate?.();
  };
  const editCustomProgram=(p)=>{
    const editable=p.coachId===user.id?p:{...p,id:`cp-${user.id}-${p.id}`,coachId:user.id,variantNote:"Özel",sourceTemplateId:p.id};
    setProgramEditing(editable);
    setCustomProgram({name:editable.name||"",desc:editable.desc||"",duration:editable.duration||"30 gün",tasks:(editable.tasks||[]).map(t=>[t.title,t.scheduledTime,t.section,t.note].filter(Boolean).join(" | ")).join("\n"),productVideo:editable.productVideo||null});
    setProgramAdding(true);
  };
  const deleteCustomProgram=async(p)=>{
    if(!window.confirm(`${p.name} silinsin mi?`))return;
    if(isProductionMode()&&user.supabaseToken&&isCloudId(p.id)){try{await deleteCloudProgram(p.id,user.supabaseToken);}catch(err){console.warn("cloud-delete-program",err);alert("Program buluttan silinemedi. Bağlantıyı kontrol edip tekrar deneyin.");return;}}
    DB.setPrograms(DB.programs().filter(x=>x.id!==p.id));
    DB.setUsers(DB.users().map(u=>u.programTemplateId===p.id?{...u,program:"Program atanmadı",programTemplateId:"",programDraft:null,tasks:[],pendingToday:0,photoPendingToday:0,missedToday:0,compliance:0}:u));
    onUpdate?.();
  };
  const removeProgram=(p)=>{
    if(p.coachId===user.id){deleteCustomProgram(p);return;}
    if(!window.confirm(`${p.name} bu koçun kayıtlı program listesinden kaldırılsın mı?`))return;
    const updated={...user,hiddenProgramIds:[...new Set([...(user.hiddenProgramIds||[]),p.id])]};
    DB.setUsers(DB.users().map(u=>u.id===user.id?updated:u));
    saveSession(updated);onUpdate?.(updated);
  };
  const pref=(key,label,value,setValue)=>{const shown=!editing&&!(value||"").trim()?"Eklenmedi":value;return <div style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:800,color:C.ink,marginBottom:5,...F}}>{label}</div><input value={shown} onChange={e=>setValue(e.target.value)} disabled={!editing} style={controlStyle({border:`1.5px solid ${editing?C.mint:C.foam}`,borderRadius:13,padding:"12px",fontSize:13,background:editing?C.white:C.foam,color:shown==="Eklenmedi"?C.stone:C.ink})}/></div>};
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:C.mist}}>
      <div style={{background:"rgba(255,255,255,.74)",padding:"8px 20px 16px",backdropFilter:"blur(14px)",borderBottom:"1px solid rgba(255,255,255,.78)"}}><div style={{fontSize:11,color:C.stone,fontWeight:600,letterSpacing:.5,...F}}>PROFİL</div><div style={{fontSize:22,fontWeight:800,color:C.ink,...F}}>{isCoach?"Koç Profili":"Profilim"}</div></div>
      <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
        {programAdding&&<div style={{position:"absolute",inset:0,background:"rgba(10,31,22,.72)",zIndex:80,display:"flex",alignItems:"flex-end"}}><div style={{background:C.white,borderRadius:"24px 24px 0 0",padding:"20px",width:"100%",maxHeight:"86%",overflowY:"auto",boxSizing:"border-box"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div><div style={{fontSize:18,fontWeight:800,color:C.ink,...F}}>{programEditing?"Program Düzenle":"Program Ekle"}</div><div style={{fontSize:12,color:C.stone,...F}}>Her satır: Görev adı | Saat | Bölüm | Kullanım notu</div></div><button onClick={()=>{setProgramAdding(false);setProgramEditing(null);setCustomProgram({name:"",desc:"",duration:"30 gün",tasks:"",productVideo:null});}} style={{border:"none",background:C.foam,borderRadius:12,padding:"8px 12px",color:C.stone,...F}}>Kapat</button></div>{[["name","Program adı"],["desc","Açıklama"],["duration","Süre"]].map(([k,l])=><div key={k} style={{marginBottom:8}}><div style={{fontSize:11,fontWeight:800,color:C.ink,marginBottom:5,...F}}>{l}</div><input value={customProgram[k]} onChange={e=>setCustomProgram(p=>({...p,[k]:e.target.value}))} style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${C.mint}`,borderRadius:12,padding:"10px",fontSize:13,color:C.ink,...F}}/></div>)}<div style={{fontSize:11,fontWeight:800,color:C.ink,marginBottom:5,...F}}>Program videosu</div><input ref={programVideoRef} type="file" accept="video/*" onChange={saveProgramVideo} style={{display:"none"}}/><button onClick={()=>programVideoRef.current?.click()} style={{width:"100%",border:"none",background:customProgram.productVideo?C.mint:C.foam,color:customProgram.productVideo?C.emerald:C.stone,borderRadius:12,padding:"10px",fontSize:12,fontWeight:800,marginBottom:10,...F}}>{customProgram.productVideo?`Video eklendi: ${customProgram.productVideo.name}`:"Video Ekle"}</button><div style={{fontSize:11,fontWeight:800,color:C.ink,marginBottom:5,...F}}>Görev satırları</div><textarea value={customProgram.tasks} onChange={e=>setCustomProgram(p=>({...p,tasks:e.target.value}))} placeholder={"Sabah karışımı | 07:15 | Kahvaltı | 500 ml suya 4 kapak Aloe Vera\nÖğle yemeği | 12:30 | Ana Öğün | Protein, karbonhidrat ve lif dengeli tabak"} style={{width:"100%",boxSizing:"border-box",minHeight:150,border:`1.5px solid ${C.mint}`,borderRadius:12,padding:10,fontSize:12,color:C.ink,outline:"none",...F}}/><button onClick={createCustomProgram} style={{width:"100%",border:"none",background:C.emerald,color:C.white,borderRadius:15,padding:"13px",fontWeight:800,marginTop:12,...F}}>{programEditing?"Değişiklikleri Kaydet":"Programı Kaydet"}</button></div></div>}
        <Card style={{padding:"18px",marginBottom:14,background:coverBg(user)}}><div style={{display:"flex",gap:16,alignItems:"center"}}><Avatar user={user} size={86} bg="rgba(255,255,255,.28)" fg={C.white}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:21,fontWeight:900,color:C.white,...F}}>{user.name}</div><div style={{fontSize:12,color:"rgba(255,255,255,.78)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%",...F}}>{user.email}</div>{isCoach&&<div style={{fontSize:12,color:C.gold,marginTop:6,fontWeight:800,...F}}>Ref: {user.refCode}</div>}</div><input ref={photoRef} type="file" accept="image/*" onChange={changePhoto} style={{display:"none"}}/><button disabled={!isCoach&&user.profilePhotoLocked} onClick={()=>photoRef.current?.click()} style={{border:"none",background:(!isCoach&&user.profilePhotoLocked)?"rgba(255,255,255,.12)":C.white,color:(!isCoach&&user.profilePhotoLocked)?"rgba(255,255,255,.45)":C.emerald,borderRadius:12,padding:"8px 10px",fontSize:11,fontWeight:800,flexShrink:0,...F}}>{!isCoach&&user.profilePhotoLocked?"Kilitli":"Foto"}</button></div>{!isCoach&&user.profilePhotoLocked&&<div style={{fontSize:11,color:"rgba(255,255,255,.72)",marginTop:10,...F}}>Profil fotoğrafı bir kere değiştirildi.</div>}</Card>
        <Card style={{padding:"16px",marginBottom:14}}><div style={{fontSize:14,fontWeight:800,color:C.ink,marginBottom:10,...F}}>Arka Plan</div><div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>{COVER_THEMES.map((bg,i)=><button key={i} onClick={()=>changeCover(bg)} style={{height:42,borderRadius:14,border:coverBg(user)===bg?`3px solid ${C.emerald}`:`2px solid ${C.white}`,background:bg,boxShadow:"0 4px 12px rgba(13,61,43,.12)",cursor:"pointer"}}/>)}</div></Card>
        <Card style={{padding:"16px",marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontSize:14,fontWeight:800,color:C.ink,...F}}>Profil Bilgileri</div><button onClick={()=>editing?saveProfile():setEditing(true)} style={{border:"none",background:editing?C.emerald:C.foam,color:editing?C.white:C.emerald,borderRadius:12,padding:"8px 12px",fontWeight:800,...F}}>{editing?"Kaydet":"Düzenle"}</button></div>{pref("name","Ad soyad",form.name,v=>setForm(f=>({...f,name:v})))}{pref("email","E-posta",form.email,v=>setForm(f=>({...f,email:v})))}{pref("phone","Telefon",form.phone,v=>setForm(f=>({...f,phone:v})))}</Card>
        {isCoach&&<><input ref={rowVideoRef} type="file" accept="video/*" onChange={saveProgramRowVideo} style={{display:"none"}}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>{[{l:"Danışan",v:clients.length,c:C.emerald},{l:"Program",v:activePrograms.length,c:C.blue},{l:"Yasaklı",v:banned.length,c:C.risk},{l:"Fotoğraf",v:clients.reduce((a,c)=>a+(c.photoPendingToday||0),0),c:C.warn}].map(x=><Card key={x.l} style={{padding:"14px"}}><div style={{fontSize:10,color:C.stone,marginBottom:4,...F}}>{x.l}</div><div style={{fontSize:24,fontWeight:800,color:x.c,...F}}>{x.v}</div></Card>)}</div><Card style={{padding:"16px",marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontSize:14,fontWeight:800,color:C.ink,...F}}>Kayıtlı Programlar</div><button onClick={()=>{setProgramEditing(null);setCustomProgram({name:"",desc:"",duration:"30 gün",tasks:"",productVideo:null});setProgramAdding(true);}} style={{border:"none",background:C.mint,color:C.emerald,borderRadius:10,padding:"7px 10px",fontSize:11,fontWeight:800,...F}}>+ Program</button></div>{allPrograms(user.id).map(t=><div key={t.id} style={{padding:"10px 0",borderBottom:`1px solid ${C.foam}`}}><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}><b style={{fontSize:13,color:C.ink,...F}}>{t.name}</b><span style={{fontSize:11,color:t.coachId?C.blue:C.stone,...F}}>{t.coachId?"Özel":t.duration}</span></div><div style={{fontSize:11,color:C.stone,marginTop:4,...F}}>{t.desc}</div>{t.productVideo&&<div style={{fontSize:10,color:C.emerald,fontWeight:800,marginTop:5,...F}}>Video kayıtlı: {t.productVideo.name||"ürün videosu"}</div>}<div style={{display:"flex",gap:8,marginTop:9,flexWrap:"wrap"}}><button onClick={()=>editCustomProgram(t)} style={{border:"none",background:C.blueBg,color:C.blue,borderRadius:10,padding:"7px 10px",fontSize:11,fontWeight:900,...F}}>Düzenle</button><button onClick={()=>{setVideoProgram(t);setTimeout(()=>rowVideoRef.current?.click(),0);}} style={{border:"none",background:C.mint,color:C.emerald,borderRadius:10,padding:"7px 10px",fontSize:11,fontWeight:900,...F}}>Video Ekle</button><button onClick={()=>removeProgram(t)} style={{border:"none",background:"#fde8e6",color:C.risk,borderRadius:10,padding:"7px 10px",fontSize:11,fontWeight:900,...F}}>Sil</button></div></div>)}</Card><Card style={{padding:"16px",marginBottom:14}}><div style={{fontSize:14,fontWeight:800,color:C.ink,marginBottom:10,...F}}>Ürün Kullanım Videoları</div>{productVideos.length===0?<div style={{fontSize:12,color:C.stone,...F}}>Henüz kayıtlı ürün videosu yok.</div>:productVideos.map(({client:c,video:v},i)=><div key={(v.mediaId||c.id)+i} style={{padding:"10px 0",borderBottom:`1px solid ${C.foam}`}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><b style={{fontSize:13,color:C.ink,...F}}>{v.name||"Ürün videosu"}</b><Pill bg={videoActive(v)&&c.productVideo?.mediaId===v.mediaId?C.mint:C.foam} color={videoActive(v)&&c.productVideo?.mediaId===v.mediaId?C.emerald:C.stone}>{videoActive(v)&&c.productVideo?.mediaId===v.mediaId?"Danışanda aktif":"Taslak"}</Pill></div><div style={{fontSize:11,color:C.stone,marginTop:4,...F}}>{c.name} · {displayProgram(c)} · {v.assignedAt}</div></div>)}</Card><Card style={{padding:"16px",marginBottom:14,border:banned.length?`1.5px solid #ffd4d0`:undefined}}><div style={{fontSize:14,fontWeight:800,color:C.ink,marginBottom:10,...F}}>Yasaklı Liste</div>{banned.length===0?<div style={{fontSize:12,color:C.stone,...F}}>Yasaklı danışan yok.</div>:banned.map(c=><div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${C.foam}`}}><Av ini={ini(c.name)} size={34} bg="#fde8e6" fg={C.risk}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:800,color:C.ink,...F}}>{c.name}</div><div style={{fontSize:11,color:C.stone,...F}}>{c.email}</div></div><button onClick={()=>unban(c.id)} style={{border:"none",background:C.mint,color:C.emerald,borderRadius:10,padding:"7px 10px",fontWeight:800,fontSize:11,...F}}>Aktifleştir</button></div>)}</Card></>}
        {!isCoach&&<Card style={{padding:"16px",marginBottom:14}}><div style={{fontSize:14,fontWeight:800,color:C.ink,marginBottom:10,...F}}>Saat Tercihleri</div>{prefTasks.length===0?<div style={{fontSize:12,color:C.stone,lineHeight:1.45,...F}}>Program atandığında görev saatleri burada düzenlenebilir.</div>:prefTasks.map(t=><div key={t.idx} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${C.foam}`}}><span style={{fontSize:12,color:C.ink,flex:1,...F}}>{t.l}</span><input type="time" value={prefs.taskTimes?.[t.idx]||t.alarm||"09:00"} disabled={user.schedulePrefsLocked} onChange={e=>setPrefs(p=>({...p,taskTimes:{...(p.taskTimes||{}),[t.idx]:e.target.value}}))} style={{border:`1.5px solid ${user.schedulePrefsLocked?C.foam:C.mint}`,background:user.schedulePrefsLocked?C.foam:C.white,borderRadius:10,padding:"8px",fontSize:13,color:C.emerald,fontWeight:800,...F}}/></div>)}<div style={{fontSize:11,color:C.stone,marginTop:10,...F}}>{user.schedulePrefsLocked?"Saat tercihleri bir kere kaydedildi. Bundan sonra koç veya otomatik program saatleri uygulanır.":"Bu tercihleri programa göre bir kere kaydedebilirsin; sonra koç/otomatik saatler geçerli olur."}</div>{!user.schedulePrefsLocked&&prefTasks.length>0&&<button onClick={savePrefs} style={{width:"100%",border:"none",background:C.emerald,color:C.white,borderRadius:14,padding:"12px",fontSize:13,fontWeight:800,marginTop:12,...F}}>Saatleri Kaydet</button>}</Card>}
        <AlarmPermissionCard/>
        <Card style={{padding:"16px",marginBottom:14}}><div style={{fontSize:14,fontWeight:800,color:C.ink,marginBottom:10,...F}}>Güvenlik</div>{[["current","Mevcut şifre"],["next","Yeni şifre"]].map(([k,l])=><div key={k} style={{marginBottom:8}}><div style={{fontSize:11,fontWeight:800,color:C.ink,marginBottom:5,...F}}>{l}</div><input type="password" value={security[k]} onChange={e=>setSecurity(s=>({...s,[k]:e.target.value,msg:""}))} style={controlStyle({padding:"10px",fontSize:12})}/></div>)}{security.msg&&<div style={{fontSize:11,color:security.msg.includes("güncellendi")?C.emerald:C.risk,marginBottom:8,...F}}>{security.msg}</div>}<button onClick={changePassword} style={buttonStyle({variant:"mint",style:{width:"100%",borderRadius:13,padding:"11px"}})}>Şifreyi Güncelle</button></Card>
        <button onClick={onLogout} style={{width:"100%",border:"1px solid rgba(217,79,61,.25)",background:"#fde8e6",color:C.risk,borderRadius:16,padding:"14px",fontSize:14,fontWeight:800,...F}}>Çıkış Yap</button><div style={{height:12}}/>
        <button onClick={deleteAccount} style={{width:"100%",border:"1px solid rgba(217,79,61,.25)",background:C.white,color:C.risk,borderRadius:16,padding:"13px",fontSize:13,fontWeight:800,marginTop:8,...F}}>Hesabı Sil</button><div style={{height:12}}/>
      </div>
    </div>
  );
};
const AdminPanel=({admin,onLogout})=>{
  const [tab,setTab]=useState("dashboard");
  const [users,setUsers]=useState(DB.users());
  const [q,setQ]=useState("");const [filter,setFilter]=useState("all");
  const [confirmDel,setConfirmDel]=useState(null);
  const [selectedUser,setSelectedUser]=useState(null);
  const [newCode,setNewCode]=useState("");const [codeMsg,setCodeMsg]=useState("");
  const importRef=useRef(null);
  const readiness=productionReadiness();
  const refresh=()=>setUsers(DB.users());
  const closeEditor=(updated)=>{setSelectedUser(null);refresh();};
  const banUser=async(id)=>{const target=DB.users().find(u=>u.id===id);const nextStatus=target?.status==="banned"?"active":"banned";if(isProductionMode()&&admin.supabaseToken){try{await saveProfilePatch(id,{status:nextStatus},admin.supabaseToken);}catch(err){console.warn("cloud-admin-status",err);}}DB.setUsers(DB.users().map(u=>u.id===id?{...u,status:nextStatus}:u));await recordAudit({actor:admin,action:nextStatus==="banned"?"user_banned":"user_activated",targetTable:"profiles",targetId:id,metadata:{name:target?.name,role:target?.role}});refresh();};
  const delUser=async(id)=>{const target=DB.users().find(u=>u.id===id);if(isProductionMode()&&admin.supabaseToken){try{await saveProfilePatch(id,{status:"deleted"},admin.supabaseToken);}catch(err){console.warn("cloud-admin-delete",err);}}DB.setUsers(DB.users().filter(u=>u.id!==id));await recordAudit({actor:admin,action:"user_deleted",targetTable:"profiles",targetId:id,metadata:{name:target?.name,role:target?.role,email:target?.email}});refresh();setConfirmDel(null);};
  const exportBackup=async()=>{const data={users:DB.users(),msgs:DB.msgs(),sess:DB.sess(),taskLogs:DB.taskLogs(),auditLogs:DB.auditLogs(),exportedAt:new Date().toISOString()};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download=`stepwise-yedek-${todayKey()}.json`;a.click();URL.revokeObjectURL(url);await recordAudit({actor:admin,action:"backup_exported",targetTable:"workspace",metadata:{users:data.users.length,msgs:data.msgs.length}});};
  const importBackup=(e)=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=async()=>{try{const data=JSON.parse(reader.result);if(!Array.isArray(data.users))throw new Error("users yok");if(isProductionMode()&&admin.supabaseToken){const result=await adminImportWorkspace(data,admin.supabaseToken);await recordAudit({actor:admin,action:"workspace_imported_cloud",targetTable:"workspace",metadata:result});alert(`Cloud aktarım tamamlandı. Kullanıcı: ${result.users||0}, program: ${result.programs||0}, randevu: ${result.appointments||0}, mesaj: ${result.messages||0}`);}else{DB.setUsers(data.users);DB.setMsgs(data.msgs||[]);DB.setSess(data.sess||[]);DB.setTaskLogs(data.taskLogs||[]);DB.setAuditLogs(data.auditLogs||DB.auditLogs());await recordAudit({actor:admin,action:"workspace_imported_local",targetTable:"workspace",metadata:{users:data.users.length,msgs:(data.msgs||[]).length}});refresh();alert("Yedek içe aktarıldı.");}}catch(err){console.warn("import-backup",err);alert("Yedek dosyası okunamadı veya cloud aktarım başarısız.");}};reader.readAsText(file);e.target.value="";};
  const createCoachCode=async()=>{const code=(newCode.trim().toUpperCase()||`COACH-${Date.now().toString().slice(-6)}`);if(DB.coachCodes().some(c=>c.code===code)){setCodeMsg("Bu kod zaten var.");return;}if(isProductionMode()&&admin.supabaseToken){try{await createCloudCoachCode(code,admin.supabaseToken);}catch(err){setCodeMsg("Kod sunucuda üretilemedi.");console.warn("cloud-coach-code",err);return;}}DB.setCoachCodes([{code,status:"active",createdAt:todayKey(),usedBy:null,usedAt:null},...DB.coachCodes()]);await recordAudit({actor:admin,action:"coach_code_created",targetTable:"coach_codes",targetId:code,metadata:{code}});setNewCode("");setCodeMsg(`Kod üretildi: ${code}`);refresh();};
  const coaches=users.filter(u=>u.role==="coach");
  const clients=users.filter(u=>u.role==="client");
  const coachName=(u)=>u.role==="client"?(users.find(c=>c.id===u.coachId)?.name||"Atanmamış"):"-";
  const filUsers=users.filter(u=>u.role!=="admin").filter(u=>{
    const mq=u.name.toLowerCase().includes(q.toLowerCase())||u.email.toLowerCase().includes(q.toLowerCase());
    const mf=filter==="all"||(filter==="coach"&&u.role==="coach")||(filter==="client"&&u.role==="client")||(filter==="banned"&&u.status==="banned");
    return mq&&mf;
  });

  const SideBtn=({id,icon,label})=>(
    <button onClick={()=>setTab(id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:12,border:"none",cursor:"pointer",textAlign:"left",width:"100%",background:tab===id?"rgba(37,168,116,.15)":"transparent",color:tab===id?C.jade:C.adm,fontWeight:tab===id?700:400,fontSize:13,transition:"all .15s",...F}}>
      <Ico d={icon} size={16} color={tab===id?C.jade:C.adm}/>{label}
    </button>
  );

  return(
    <div style={{minHeight:"100vh",background:C.adk,color:C.adt,...F}}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      {/* TOP BAR */}
      <div style={{background:C.adc,borderBottom:`1px solid ${C.adb}`,padding:"0 24px",display:"flex",alignItems:"center",height:60,gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
          <div style={{width:32,height:32,borderRadius:10,background:C.emerald,display:"flex",alignItems:"center",justifyContent:"center"}}><Ico d={IC.shield} size={16} color={C.white} stroke={1.5}/></div>
          <span style={{fontSize:16,fontWeight:800,color:C.adt,...F}}>StepWise Plus Admin</span>
        </div>
        <div style={{fontSize:12,color:C.adm,...F}}>{admin.email}</div>
        <button onClick={onLogout} style={{background:"none",border:`1px solid ${C.adb}`,borderRadius:10,padding:"7px 14px",color:C.adm,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6,...F}}>
          <Ico d={IC.logout} size={14} color={C.adm}/>Çıkış
        </button>
      </div>
      <div style={{display:"flex",height:"calc(100vh - 60px)"}}>
        {/* SIDEBAR */}
        <div style={{width:200,background:C.adc,borderRight:`1px solid ${C.adb}`,padding:"20px 12px",display:"flex",flexDirection:"column",gap:4}}>
          <SideBtn id="dashboard" icon={IC.activity} label="Dashboard"/>
          <SideBtn id="users" icon={IC.clients} label="Kullanıcılar"/>
          <SideBtn id="messages" icon={IC.msg} label="Mesajlar"/>
          <SideBtn id="audit" icon={IC.shield} label="Loglar"/>
          <SideBtn id="settings" icon={IC.settings} label="Ayarlar"/>
        </div>
        {/* MAIN */}
        <div style={{flex:1,overflowY:"auto",padding:"24px"}}>

          {tab==="dashboard"&&(
            <div>
              <div style={{fontSize:22,fontWeight:800,marginBottom:20,...F}}>Dashboard</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
                {[{l:"Toplam Koç",v:coaches.length,c:"#60a5fa",bg:"#1e3a5f"},{l:"Toplam Danışan",v:clients.length,c:"#34d399",bg:"#1e3d2e"},{l:"Aktif",v:users.filter(u=>u.status==="active").length,c:"#a78bfa",bg:"#2e1e4f"},{l:"Askıda",v:users.filter(u=>u.status==="banned").length,c:"#f87171",bg:"#4f1e1e"}].map((s,i)=>(
                  <div key={i} style={{background:s.bg,borderRadius:16,padding:"20px",border:`1px solid ${C.adb}`}}>
                    <div style={{fontSize:11,color:C.adm,fontWeight:600,letterSpacing:.5,marginBottom:8,...F}}>{s.l.toUpperCase()}</div>
                    <div style={{fontSize:36,fontWeight:800,color:s.c,...F}}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div style={{background:C.adc,borderRadius:16,padding:"20px",border:`1px solid ${C.adb}`}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:16,...F}}>Son Kayıtlar</div>
                  {users.filter(u=>u.role!=="admin").slice(-5).reverse().map((u,i)=>(
                    <div key={i} style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:u.role==="coach"?C.emerald:C.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:C.white,...F}}>{ini(u.name)}</div>
                      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.adt,...F}}>{u.name}</div><div style={{fontSize:11,color:C.adm,...F}}>{u.email}</div></div>
                      <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:700,background:u.role==="coach"?"rgba(37,168,116,.15)":"rgba(59,125,216,.15)",color:u.role==="coach"?C.jade:"#60a5fa",...F}}>{u.role==="coach"?"Koç":"Danışan"}</span>
                    <div style={{fontSize:12,color:u.role==="client"?C.adt:C.adm,fontWeight:u.role==="client"?700:500,...F}}>{coachName(u)}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:C.adc,borderRadius:16,padding:"20px",border:`1px solid ${C.adb}`}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:16,...F}}>Koç Bazlı Danışan</div>
                  {coaches.map((c,i)=>{const cc=users.filter(u=>u.role==="client"&&u.coachId===c.id);return(
                    <div key={i} style={{marginBottom:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,color:C.adt,...F}}>{c.name}</span><span style={{fontSize:12,color:C.adm,...F}}>{cc.length} danışan</span></div>
                      <div style={{height:6,background:C.adb,borderRadius:3,overflow:"hidden"}}><div style={{width:`${Math.min((cc.length/5)*100,100)}%`,height:"100%",background:C.jade,borderRadius:3}}/></div>
                    </div>
                  );})}
                </div>
              </div>
            </div>
          )}

          {tab==="users"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div style={{fontSize:22,fontWeight:800,...F}}>Kullanıcılar</div>
                <div style={{fontSize:13,color:C.adm,...F}}>{filUsers.length} kayıt</div>
              </div>
              <div style={{display:"flex",gap:10,marginBottom:16}}>
                <div style={{flex:1,display:"flex",alignItems:"center",gap:10,background:C.adc,borderRadius:12,padding:"10px 14px",border:`1px solid ${C.adb}`}}>
                  <Ico d={IC.search} size={16} color={C.adm}/>
                  <input value={q} onChange={e=>setQ(e.target.value)} placeholder="İsim veya e-posta ara…" style={{border:"none",background:"none",outline:"none",fontSize:13,color:C.adt,width:"100%",...F}}/>
                </div>
                {["all","coach","client","banned"].map(f=>(
                  <button key={f} onClick={()=>setFilter(f)} style={{border:"none",borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer",background:filter===f?C.jade:"transparent",color:filter===f?C.forest:C.adm,outline:filter===f?"none":`1px solid ${C.adb}`,...F}}>
                    {{all:"Tümü",coach:"Koçlar",client:"Danışanlar",banned:"Askıda"}[f]}
                  </button>
                ))}
              </div>
              <div style={{background:C.adc,borderRadius:16,border:`1px solid ${C.adb}`,overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1.4fr 1fr 1fr 1fr",padding:"12px 20px",borderBottom:`1px solid ${C.adb}`,fontSize:11,fontWeight:700,color:C.adm,letterSpacing:.5,...F}}>
                  <div>AD SOYAD</div><div>E-POSTA</div><div>ROL</div><div>KOÇ</div><div>DURUM</div><div>KAYIT</div><div>İŞLEM</div>
                </div>
                {filUsers.map((u,i)=>(
                  <div key={u.id} onClick={()=>setSelectedUser(u)} style={{display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1.4fr 1fr 1fr 1fr",padding:"14px 20px",borderBottom:i<filUsers.length-1?`1px solid ${C.adb}`:"none",alignItems:"center",background:u.status==="banned"?"rgba(248,113,113,.05)":"transparent",cursor:"pointer"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:u.role==="coach"?C.emerald:C.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:C.white,flexShrink:0,...F}}>{ini(u.name)}</div>
                      <span style={{fontSize:13,fontWeight:600,color:C.adt,...F}}>{u.name}</span>
                    </div>
                    <div style={{fontSize:12,color:C.adm,...F}}>{u.email}</div>
                    <div><span style={{fontSize:10,padding:"3px 8px",borderRadius:20,fontWeight:700,background:u.role==="coach"?"rgba(37,168,116,.15)":"rgba(59,125,216,.15)",color:u.role==="coach"?C.jade:"#60a5fa",...F}}>{u.role==="coach"?"Koç":"Danışan"}</span></div>
                    <div style={{fontSize:12,color:u.role==="client"?C.adt:C.adm,fontWeight:u.role==="client"?700:500,...F}}>{coachName(u)}</div>
                    <div><span style={{fontSize:10,padding:"3px 8px",borderRadius:20,fontWeight:700,background:u.status==="banned"?"rgba(248,113,113,.15)":"rgba(52,211,153,.15)",color:u.status==="banned"?"#f87171":"#34d399",...F}}>{u.status==="banned"?"Askıda":"Aktif"}</span></div>
                    <div style={{fontSize:11,color:C.adm,...F}}>{u.createdAt}</div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={(e)=>{e.stopPropagation();banUser(u.id);}} title={u.status==="banned"?"Aktifleştir":"Askıya Al"} style={{width:30,height:30,borderRadius:8,border:`1px solid ${C.adb}`,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Ico d={IC.eye} size={14} color={u.status==="banned"?C.jade:C.warn}/></button>
                      <button onClick={(e)=>{e.stopPropagation();setConfirmDel(u);}} style={{width:30,height:30,borderRadius:8,border:"1px solid rgba(248,113,113,.3)",background:"rgba(248,113,113,.05)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Ico d={IC.trash} size={14} color="#f87171"/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==="messages"&&(
            <div>
              <div style={{fontSize:22,fontWeight:800,marginBottom:20,...F}}>Tüm Mesajlar</div>
              <div style={{background:C.adc,borderRadius:16,border:`1px solid ${C.adb}`,overflow:"hidden"}}>
                {DB.msgs().slice(-20).reverse().map((m,i,arr)=>{
                  const from=users.find(u=>u.id===m.from),to=users.find(u=>u.id===m.to);
                  return(
                    <div key={m.id} style={{padding:"14px 20px",borderBottom:i<arr.length-1?`1px solid ${C.adb}`:"none",display:"flex",gap:14,alignItems:"flex-start"}}>
                      <div style={{width:36,height:36,borderRadius:"50%",background:C.emerald,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:C.white,...F}}>{ini(from?.name)}</div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
                          <span style={{fontSize:13,fontWeight:700,color:C.adt,...F}}>{from?.name||m.from}</span>
                          <span style={{fontSize:11,color:C.adm,...F}}>→</span>
                          <span style={{fontSize:13,fontWeight:600,color:C.jade,...F}}>{to?.name||m.to}</span>
                          <span style={{fontSize:11,color:C.adm,marginLeft:"auto",...F}}>{m.date} {m.time}</span>
                        </div>
                        <div style={{fontSize:13,color:C.adm,...F}}>{m.text}</div>
                      </div>
                      <button onClick={()=>{DB.setMsgs(DB.msgs().filter(x=>x.id!==m.id));refresh();}} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ico d={IC.trash} size={14} color="#f87171"/></button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab==="audit"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div style={{fontSize:22,fontWeight:800,...F}}>Güvenlik Logları</div>
                <div style={{fontSize:13,color:C.adm,...F}}>{DB.auditLogs().length} kayıt</div>
              </div>
              <div style={{background:C.adc,borderRadius:16,border:`1px solid ${C.adb}`,overflow:"hidden"}}>
                {DB.auditLogs().length===0?<div style={{padding:"24px",fontSize:13,color:C.adm,...F}}>Henüz işlem kaydı yok.</div>:DB.auditLogs().map((log,i,arr)=>(
                  <div key={log.id||i} style={{display:"grid",gridTemplateColumns:"1.2fr 1.3fr 1fr 2fr",gap:14,padding:"14px 20px",borderBottom:i<arr.length-1?`1px solid ${C.adb}`:"none",alignItems:"center"}}>
                    <div><div style={{fontSize:13,fontWeight:800,color:C.adt,...F}}>{log.action}</div><div style={{fontSize:11,color:C.adm,marginTop:3,...F}}>{log.date} {log.time}</div></div>
                    <div style={{fontSize:12,color:C.adm,...F}}>{log.actorName||log.actorId||"Sistem"}</div>
                    <div style={{fontSize:12,color:C.jade,fontWeight:800,...F}}>{log.targetTable||"-"}</div>
                    <div style={{fontSize:11,color:C.adm,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",...F}}>{log.targetId||""} {log.metadata?JSON.stringify(log.metadata):""}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==="settings"&&(
            <div>
              <div style={{fontSize:22,fontWeight:800,marginBottom:20,...F}}>Sistem Ayarları</div>
              <div style={{background:C.adc,borderRadius:16,padding:"20px",border:`1px solid ${readiness.ready?"rgba(37,168,116,.35)":"rgba(248,113,113,.28)"}`,marginBottom:20}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",marginBottom:12}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:800,color:C.adt,marginBottom:4,...F}}>Yayın Hazırlığı</div>
                    <div style={{fontSize:12,color:C.adm,lineHeight:1.45,...F}}>{readiness.ready?"Temel production bağlantıları hazır görünüyor.":"Yayın için tamamlanması gereken temel ayarlar var."}</div>
                  </div>
                  <span style={{fontSize:11,fontWeight:900,padding:"5px 10px",borderRadius:999,background:readiness.ready?"rgba(37,168,116,.16)":"rgba(248,113,113,.15)",color:readiness.ready?C.jade:"#f87171",whiteSpace:"nowrap",...F}}>{readiness.ready?"HAZIR":"EKSİK"}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:readiness.missing.length||readiness.warnings.length?12:0}}>
                  {readiness.checks.map(item=><div key={item.label} style={{background:C.adk,border:`1px solid ${C.adb}`,borderRadius:10,padding:"10px 12px"}}><div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{width:8,height:8,borderRadius:"50%",background:item.ok?C.jade:"#f87171",boxShadow:item.ok?"0 0 0 3px rgba(37,168,116,.12)":"0 0 0 3px rgba(248,113,113,.12)"}}/><span style={{fontSize:12,fontWeight:800,color:C.adt,...F}}>{item.label}</span></div>{item.note&&<div style={{fontSize:10,color:C.adm,marginTop:5,lineHeight:1.35,...F}}>{item.note}</div>}</div>)}
                </div>
                {readiness.missing.length>0&&<div style={{fontSize:12,color:"#f87171",fontWeight:800,marginBottom:6,...F}}>Eksik: {readiness.missing.join(", ")}</div>}
                {readiness.warnings.length>0&&<div style={{fontSize:12,color:C.warn,fontWeight:800,...F}}>Uyarı: {readiness.warnings.join(", ")}</div>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
                {[{l:"Aktif Koç Kodu",v:DB.coachCodes().filter(c=>c.status==="active").length,d:"Tek kullanımlık koç kayıt kodları"},{l:"Toplam Kullanıcı",v:users.length,d:"Admin dahil tüm kayıtlar"},{l:"Toplam Mesaj",v:DB.msgs().length,d:"Sistemdeki tüm mesajlar"},{l:"Toplam Seans",v:DB.sess().length,d:"Kayıtlı tüm seanslar"}].map((s,i)=>(
                  <div key={i} style={{background:C.adc,borderRadius:16,padding:"20px",border:`1px solid ${C.adb}`}}>
                    <div style={{fontSize:11,color:C.adm,fontWeight:700,letterSpacing:.5,marginBottom:8,...F}}>{s.l.toUpperCase()}</div>
                    <div style={{fontSize:20,fontWeight:800,color:C.adt,marginBottom:4,...F}}>{s.v}</div>
                    <div style={{fontSize:12,color:C.adm,...F}}>{s.d}</div>
                  </div>
                ))}
              </div>
              <div style={{background:C.adc,borderRadius:16,padding:"20px",border:`1px solid ${C.adb}`,marginBottom:20}}>
                <div style={{fontSize:14,fontWeight:700,color:C.adt,marginBottom:8,...F}}>Koç Kayıt Kodları</div>
                <div style={{fontSize:13,color:C.adm,marginBottom:12,...F}}>Her kod tek koç kaydında kullanılır. Koç, danışanları için kendi referans kodunu ayrıca belirler.</div>
                <div style={{display:"flex",gap:10,marginBottom:12}}><input value={newCode} onChange={e=>setNewCode(e.target.value.toUpperCase())} placeholder="Örn. COACH-UMUT-01" style={{flex:1,background:C.adk,border:`1px solid ${C.adb}`,borderRadius:10,padding:"10px 12px",color:C.adt,outline:"none",...F}}/><button onClick={createCoachCode} style={{background:C.jade,border:"none",borderRadius:10,padding:"10px 16px",color:C.forest,fontSize:13,fontWeight:800,cursor:"pointer",...F}}>Kod Üret</button></div>
                {codeMsg&&<div style={{fontSize:12,color:C.jade,marginBottom:10,fontWeight:800,...F}}>{codeMsg}</div>}
                <div style={{display:"grid",gap:8}}>{DB.coachCodes().map(c=><div key={c.code} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.adk,border:`1px solid ${C.adb}`,borderRadius:10,padding:"10px 12px"}}><div><div style={{fontSize:13,fontWeight:800,color:C.adt,...F}}>{c.code}</div><div style={{fontSize:11,color:C.adm,...F}}>{c.createdAt}{c.usedAt?` · kullanıldı ${c.usedAt}`:""}</div></div><span style={{fontSize:10,fontWeight:900,padding:"4px 8px",borderRadius:999,background:c.status==="active"?"rgba(37,168,116,.15)":"rgba(148,163,184,.15)",color:c.status==="active"?C.jade:C.adm,...F}}>{c.status==="active"?"AKTİF":"KULLANILDI"}</span></div>)}</div>
              </div>
              <div style={{background:C.adc,borderRadius:16,padding:"20px",border:`1px solid ${C.adb}`,marginBottom:20}}>
                <div style={{fontSize:14,fontWeight:700,color:C.adt,marginBottom:8,...F}}>Veri Yedeği</div>
                <div style={{fontSize:13,color:C.adm,marginBottom:14,...F}}>Backend bağlanana kadar test verilerini JSON olarak dışa/içe aktar.</div>
                <input ref={importRef} type="file" accept="application/json" onChange={importBackup} style={{display:"none"}}/>
                <div style={{display:"flex",gap:10}}><button onClick={exportBackup} style={{background:C.jade,border:"none",borderRadius:10,padding:"10px 16px",color:C.forest,fontSize:13,fontWeight:800,cursor:"pointer",...F}}>Yedek Al</button><button onClick={()=>importRef.current?.click()} style={{background:"transparent",border:`1px solid ${C.adb}`,borderRadius:10,padding:"10px 16px",color:C.adm,fontSize:13,fontWeight:800,cursor:"pointer",...F}}>Yedekten Yükle</button></div>
              </div>
              <div style={{background:"rgba(248,113,113,.05)",border:"1px solid rgba(248,113,113,.2)",borderRadius:16,padding:"20px"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#f87171",marginBottom:8,...F}}>⚠️ Tehlikeli Bölge</div>
                <div style={{fontSize:13,color:C.adm,marginBottom:14,...F}}>Aşağıdaki işlemler geri alınamaz.</div>
                <button onClick={()=>{if(window.confirm("Tüm veriler silinecek. Emin misiniz?")){localStorage.clear();window.location.reload();}}} style={{background:"rgba(248,113,113,.15)",border:"1px solid rgba(248,113,113,.3)",borderRadius:10,padding:"10px 20px",color:"#f87171",fontSize:13,fontWeight:700,cursor:"pointer",...F}}>Tüm Verileri Sıfırla</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedUser&&<AdminUserEditor target={selectedUser} users={users} admin={admin} onClose={()=>setSelectedUser(null)} onSaved={closeEditor}/>}
      {confirmDel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
          <div style={{background:C.adc,borderRadius:20,padding:"28px 32px",maxWidth:360,border:`1px solid ${C.adb}`}}>
            <div style={{fontSize:18,fontWeight:800,color:C.adt,marginBottom:8,...F}}>Kullanıcı Sil</div>
            <div style={{fontSize:14,color:C.adm,marginBottom:24,...F}}><b style={{color:"#f87171"}}>{confirmDel.name}</b> kalıcı olarak silinecek. Emin misiniz?</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmDel(null)} style={{flex:1,background:"transparent",border:`1px solid ${C.adb}`,borderRadius:12,padding:"11px",color:C.adm,fontSize:13,cursor:"pointer",...F}}>Vazgeç</button>
              <button onClick={()=>delUser(confirmDel.id)} style={{flex:1,background:"rgba(248,113,113,.15)",border:"1px solid rgba(248,113,113,.3)",borderRadius:12,padding:"11px",color:"#f87171",fontSize:13,fontWeight:700,cursor:"pointer",...F}}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const AdminMobilePanel=({admin,onLogout})=>{
  const [users,setUsers]=useState(DB.users());
  const [tab,setTab]=useState("dash");
  const [newCode,setNewCode]=useState("");
  const [msg,setMsg]=useState("");
  const [selectedUser,setSelectedUser]=useState(null);
  const readiness=productionReadiness();
  const refresh=()=>setUsers(DB.users());
  const toggle=async(id)=>{const target=DB.users().find(u=>u.id===id);const nextStatus=target?.status==="banned"?"active":"banned";if(isProductionMode()&&admin.supabaseToken){try{await saveProfilePatch(id,{status:nextStatus},admin.supabaseToken);}catch(err){console.warn("cloud-mobile-status",err);}}DB.setUsers(DB.users().map(u=>u.id===id?{...u,status:nextStatus}:u));await recordAudit({actor:admin,action:nextStatus==="banned"?"user_banned":"user_activated",targetTable:"profiles",targetId:id,metadata:{name:target?.name,role:target?.role}});refresh();};
  const makeCode=async()=>{const code=(newCode.trim().toUpperCase()||"COACH-"+Date.now().toString().slice(-6));if(DB.coachCodes().some(c=>c.code===code)){setMsg("Bu kod zaten var.");return;}if(isProductionMode()&&admin.supabaseToken){try{await createCloudCoachCode(code,admin.supabaseToken);}catch(err){setMsg("Kod sunucuda üretilemedi.");console.warn("cloud-mobile-code",err);return;}}DB.setCoachCodes([{code,status:"active",createdAt:todayKey(),usedBy:null,usedAt:null},...DB.coachCodes()]);await recordAudit({actor:admin,action:"coach_code_created",targetTable:"coach_codes",targetId:code,metadata:{code}});setNewCode("");setMsg("Kod üretildi: "+code);refresh();};
  const delUser=async(id)=>{if(!window.confirm("Kullanıcı silinsin mi?"))return;const target=DB.users().find(u=>u.id===id);if(isProductionMode()&&admin.supabaseToken){try{await saveProfilePatch(id,{status:"deleted"},admin.supabaseToken);}catch(err){console.warn("cloud-mobile-delete",err);}}DB.setUsers(DB.users().filter(u=>u.id!==id));await recordAudit({actor:admin,action:"user_deleted",targetTable:"profiles",targetId:id,metadata:{name:target?.name,email:target?.email,role:target?.role}});refresh();};
  const resetAll=async()=>{if(window.confirm("Tüm yerel veriler silinecek. Emin misin?")){await recordAudit({actor:admin,action:"local_data_reset",targetTable:"workspace"});localStorage.clear();window.location.reload();}};
  const coaches=users.filter(u=>u.role==="coach"),clients=users.filter(u=>u.role==="client"),banned=users.filter(u=>u.status==="banned");
  const sessions=DB.sess();
  const codes=DB.coachCodes();
  const tabs=[["dash","Özet"],["users","Kullanıcı"],["codes","Kod"],["logs","Log"],["safe","Güvenlik"]];
  return <div style={{minHeight:"100dvh",background:C.mist,...F}}>
    <div style={{background:C.forest,color:C.white,padding:"20px 18px 12px",position:"sticky",top:0,zIndex:5}}><div style={{fontSize:11,opacity:.72,fontWeight:800,letterSpacing:.5}}>ADMIN</div><div style={{fontSize:24,fontWeight:900}}>Mobil Yönetim</div><div style={{fontSize:12,opacity:.72,marginTop:4}}>{admin.email}</div><div style={{display:"flex",gap:7,overflowX:"auto",paddingTop:14}}>{tabs.map(([id,l])=><button key={id} onClick={()=>setTab(id)} style={{border:"none",borderRadius:999,padding:"8px 11px",background:tab===id?C.white:"rgba(255,255,255,.12)",color:tab===id?C.forest:C.white,fontSize:11,fontWeight:900,whiteSpace:"nowrap",...F}}>{l}</button>)}</div></div>
    <div style={{padding:"16px"}}>
      {tab==="dash"&&<><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>{[{l:"Koç",v:coaches.length,c:C.emerald},{l:"Danışan",v:clients.length,c:C.blue},{l:"Yasaklı",v:banned.length,c:C.risk},{l:"Aktif Kod",v:codes.filter(c=>c.status==="active").length,c:C.warn},{l:"Mesaj",v:DB.msgs().length,c:C.jade}].map(x=><Card key={x.l} style={{padding:"14px"}}><div style={{fontSize:10,color:C.stone,...F}}>{x.l}</div><div style={{fontSize:24,fontWeight:900,color:x.c,...F}}>{x.v}</div></Card>)}</div><Card style={{padding:"14px",marginBottom:14}}><div style={{fontSize:14,fontWeight:900,color:C.ink,marginBottom:10,...F}}>Koç Bazlı Durum</div>{coaches.map(c=>{const n=clients.filter(x=>x.coachId===c.id).length;return <div key={c.id} style={{padding:"9px 0",borderBottom:`1px solid ${C.foam}`}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:800,color:C.ink,...F}}><span>{c.name}</span><span>{n} danışan</span></div><div style={{height:6,background:C.foam,borderRadius:5,marginTop:6,overflow:"hidden"}}><div style={{width:Math.min(n*20,100)+"%",height:"100%",background:C.jade}}/></div></div>})}</Card></>}
      {tab==="users"&&<div style={{display:"grid",gap:12}}><Card style={{padding:"14px"}}><div style={{fontSize:14,fontWeight:900,color:C.ink,marginBottom:10,...F}}>Koç ve Danışan Listesi</div><div style={{fontSize:11,color:C.stone,lineHeight:1.4,...F}}>Her koçun altında yalnızca kendi danışanları görünür. Kullanıcıya dokununca genel bilgiler açılır.</div></Card>{coaches.map(coach=>{const owned=clients.filter(c=>c.coachId===coach.id);return <Card key={coach.id} style={{padding:"14px"}}><div onClick={()=>setSelectedUser(coach)} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,cursor:"pointer"}}><Avatar user={coach} size={38}/><div style={{flex:1}}><div style={{fontSize:14,fontWeight:900,color:C.ink,...F}}>{coach.name}</div><div style={{fontSize:11,color:C.stone,...F}}>Koç kodu: {coach.refCode||"-"} - {owned.length} danışan</div></div><button onClick={(e)=>{e.stopPropagation();toggle(coach.id);}} style={{border:"none",background:coach.status==="banned"?C.mint:"#fde8e6",color:coach.status==="banned"?C.emerald:C.risk,borderRadius:10,padding:"8px 9px",fontSize:11,fontWeight:800,...F}}>{coach.status==="banned"?"Aç":"Yasakla"}</button></div>{owned.length===0?<div style={{fontSize:12,color:C.stone,background:C.foam,borderRadius:12,padding:"10px",...F}}>Bu koça bağlı danışan yok.</div>:owned.map(client=><div key={client.id} onClick={()=>setSelectedUser(client)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderTop:`1px solid ${C.foam}`,cursor:"pointer"}}><Avatar user={client} size={32}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:800,color:C.ink,...F}}>{client.name}</div><div style={{fontSize:11,color:C.stone,...F}}>Bağlı koç: {coach.name} - {client.status==="banned"?"Yasaklı":"Aktif"}</div></div><button onClick={(e)=>{e.stopPropagation();toggle(client.id);}} style={{border:"none",background:client.status==="banned"?C.mint:"#fde8e6",color:client.status==="banned"?C.emerald:C.risk,borderRadius:10,padding:"8px 9px",fontSize:11,fontWeight:800,...F}}>{client.status==="banned"?"Aç":"Yasakla"}</button><button onClick={(e)=>{e.stopPropagation();delUser(client.id);}} style={{border:"none",background:C.foam,color:C.stone,borderRadius:10,padding:"8px 9px",fontSize:11,fontWeight:800,...F}}>Sil</button></div>)}</Card>})}{clients.filter(c=>!c.coachId||!users.find(u=>u.id===c.coachId)).length>0&&<Card style={{padding:"14px",border:`1.5px solid #ffd4d0`}}><div style={{fontSize:14,fontWeight:900,color:C.risk,marginBottom:8,...F}}>Koçsuz Danışanlar</div>{clients.filter(c=>!c.coachId||!users.find(u=>u.id===c.coachId)).map(client=><div key={client.id} onClick={()=>setSelectedUser(client)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderTop:`1px solid ${C.foam}`,cursor:"pointer"}}><Avatar user={client} size={32}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:800,color:C.ink,...F}}>{client.name}</div><div style={{fontSize:11,color:C.stone,...F}}>Bağlı koç bulunamadı</div></div></div>)}</Card>}</div>}
      {tab==="codes"&&<Card style={{padding:"14px",marginBottom:14}}><div style={{fontSize:14,fontWeight:900,color:C.ink,marginBottom:8,...F}}>Koç Kayıt Kodları</div><div style={{fontSize:11,color:C.stone,marginBottom:10,...F}}>Her kod tek koç kaydı içindir.</div><div style={{display:"flex",gap:8,marginBottom:10}}><input value={newCode} onChange={e=>setNewCode(e.target.value.toUpperCase())} placeholder="COACH-..." style={{flex:1,border:`1.5px solid ${C.mint}`,borderRadius:12,padding:"10px",fontSize:12,color:C.ink,outline:"none",...F}}/><button onClick={makeCode} style={{border:"none",background:C.emerald,color:C.white,borderRadius:12,padding:"10px 12px",fontWeight:900,fontSize:12,...F}}>Üret</button></div>{msg&&<div style={{fontSize:11,color:C.emerald,fontWeight:900,marginBottom:8,...F}}>{msg}</div>}{codes.map(c=><div key={c.code} style={{display:"flex",justifyContent:"space-between",gap:8,padding:"10px 0",borderBottom:`1px solid ${C.foam}`}}><div><div style={{fontSize:13,fontWeight:900,color:C.ink,...F}}>{c.code}</div><div style={{fontSize:11,color:C.stone,...F}}>{c.createdAt}{c.usedAt?"  - kullanıldı "+c.usedAt:""}</div></div><Pill bg={c.status==="active"?C.mint:C.foam} color={c.status==="active"?C.emerald:C.stone}>{c.status==="active"?"Aktif":"Kullanıldı"}</Pill></div>)}</Card>}
      {tab==="logs"&&<Card style={{padding:"14px",marginBottom:14}}><div style={{fontSize:14,fontWeight:900,color:C.ink,marginBottom:8,...F}}>Güvenlik Logları</div>{DB.auditLogs().length===0?<div style={{fontSize:12,color:C.stone,...F}}>Henüz işlem kaydı yok.</div>:DB.auditLogs().slice(0,30).map(log=><div key={log.id} style={{padding:"10px 0",borderBottom:`1px solid ${C.foam}`}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><b style={{fontSize:12,color:C.ink,...F}}>{log.action}</b><span style={{fontSize:10,color:C.stone,...F}}>{log.date} {log.time}</span></div><div style={{fontSize:11,color:C.stone,marginTop:4,...F}}>{log.actorName||"Admin"} · {log.targetTable||"-"} · {log.targetId||""}</div></div>)}</Card>}
      {tab==="sessions"&&<Card style={{padding:"14px",marginBottom:14}}><div style={{fontSize:14,fontWeight:900,color:C.ink,marginBottom:10,...F}}>Seanslar</div>{sessions.map(s=>{const coach=users.find(u=>u.id===s.coachId),client=users.find(u=>u.id===s.clientId);return <div key={s.id} style={{padding:"10px 0",borderBottom:`1px solid ${C.foam}`}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><b style={{fontSize:13,color:C.ink,...F}}>{s.type}</b><Pill bg={s.status==="confirmed"?C.mint:s.status==="pending"?"#fff4e0":C.blueBg} color={s.status==="confirmed"?C.emerald:s.status==="pending"?C.warn:C.blue}>{s.status==="confirmed"?"Onaylı":s.status==="pending"?"Bekliyor":"Yeni saat"}</Pill></div><div style={{fontSize:11,color:C.stone,marginTop:4,...F}}>{s.date} - {s.time} - {client?.name||"?"} / {coach?.name||"?"}</div></div>})}</Card>}
      {tab==="safe"&&<><Card style={{padding:"14px",marginBottom:14,border:`1.5px solid ${readiness.ready?C.mint:"#ffd4d0"}`}}><div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:10}}><div style={{fontSize:14,fontWeight:900,color:C.ink,...F}}>Yayın Hazırlığı</div><Pill bg={readiness.ready?C.mint:"#fde8e6"} color={readiness.ready?C.emerald:C.risk}>{readiness.ready?"Hazır":"Eksik"}</Pill></div><div style={{display:"grid",gap:7}}>{readiness.checks.map(item=><div key={item.label} style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",background:C.foam,borderRadius:10,padding:"8px 10px"}}><span style={{fontSize:12,fontWeight:800,color:C.ink,...F}}>{item.label}</span><span style={{fontSize:11,fontWeight:900,color:item.ok?C.emerald:C.risk,...F}}>{item.ok?"OK":"Eksik"}</span></div>)}</div>{readiness.missing.length>0&&<div style={{fontSize:11,color:C.risk,fontWeight:800,marginTop:10,...F}}>Eksik: {readiness.missing.join(", ")}</div>}{readiness.warnings.length>0&&<div style={{fontSize:11,color:C.warn,fontWeight:800,marginTop:6,...F}}>Uyarı: {readiness.warnings.join(", ")}</div>}</Card><Card style={{padding:"14px",marginBottom:14}}><div style={{fontSize:14,fontWeight:900,color:C.ink,marginBottom:8,...F}}>Güvenlik Notu</div><div style={{fontSize:12,color:C.stone,lineHeight:1.45,...F}}>Auth, RLS, audit log ve medya kayıtları production bağlantısına taşındı. Google Play öncesi release imza ve son güvenlik testi ayrıca yapılacak.</div></Card><button onClick={resetAll} style={{width:"100%",border:"1px solid rgba(217,79,61,.25)",background:"#fde8e6",color:C.risk,borderRadius:16,padding:"14px",fontSize:14,fontWeight:800,marginBottom:10,...F}}>Tüm Verileri Sıfırla</button></>}
      <button onClick={onLogout} style={{width:"100%",border:"1px solid rgba(217,79,61,.25)",background:"#fde8e6",color:C.risk,borderRadius:16,padding:"14px",fontSize:14,fontWeight:800,...F}}>Çıkış Yap</button>
    </div>
    {selectedUser&&<AdminUserEditor target={selectedUser} users={users} admin={admin} onClose={()=>setSelectedUser(null)} onSaved={()=>{setSelectedUser(null);refresh();}}/>}
  </div>;
};
// APP ROOT
export default function App() {
  const [user,setUser]=useState(null);
  const [screen,setScreen]=useState("login");
  const [tab,setTab]=useState("home");
  const [allUsers,setAllUsers]=useState([]);
  const [isMobileAdmin,setIsMobileAdmin]=useState(()=>typeof window!=="undefined"&&window.innerWidth<720);
  const [showSplash,setShowSplash]=useState(true);
  const lastCloudMsgIds=useRef(new Set());

  useEffect(()=>{
    DB.init();setAllUsers(DB.users());
    MediaStore.cleanup(collectMediaIds(DB.users())).catch(()=>{});
    const restored=restoreStoredUser(DB.users());
    if(restored)setUser(restored);
  },[]);
  useEffect(()=>{const onResize=()=>setIsMobileAdmin(window.innerWidth<720);window.addEventListener("resize",onResize);return()=>window.removeEventListener("resize",onResize);},[]);
  useEffect(()=>{const t=setTimeout(()=>setShowSplash(false),3200);return()=>clearTimeout(t);},[]);

  const applyProductionWorkspace=(workspace,currentUser=user,{notify=false}={})=>{
    if(!workspace?.users?.length)return currentUser;
    const previousIds=lastCloudMsgIds.current;
    const incoming=(workspace.msgs||[]).filter(m=>m.to===currentUser?.id&&!previousIds.has(m.id));
    const localUsers=DB.users();
    const localMsgs=DB.msgs();
    const cloudUsers=mergeCloudUsersWithLocal(normalizeUsers(workspace.users),localUsers,{hasAssignedProgram});
    const mergedMsgs=mergeMessages(workspace.msgs||[],localMsgs);
    lastCloudMsgIds.current=new Set(mergedMsgs.map(m=>m.id));
    DB.setUsers(cloudUsers);
    DB.setMsgs(mergedMsgs);
    DB.setSess(workspace.sess||[]);
    DB.setPrograms(uniquePrograms([...(workspace.programs||[]),...DB.programs()]));
    const fresh=cloudUsers.find(x=>x.id===currentUser?.id);
    const active=fresh?{...currentUser,...fresh,supabaseToken:currentUser?.supabaseToken,refreshToken:currentUser?.refreshToken}:currentUser;
    if(active){setUser(active);saveSession(active);}
    setAllUsers(cloudUsers);
    if(notify&&incoming.length){
      const last=incoming[incoming.length-1];
      const sender=cloudUsers.find(x=>x.id===last.from);
      const senderName=sender?.name||"Yeni mesaj";
      const body=last.kind==="audio"?"Sesli mesaj gönderdi":last.kind==="photo"?"Fotoğraf gönderdi":(last.text||"Yeni mesaj gönderdi");
      showLocalNotice(senderName,body);
    }
    return active;
  };

  useEffect(()=>{
    if(!isProductionMode()||!user?.supabaseToken)return;
    let alive=true;
    const sync=async(notify=false)=>{
      try{
        const workspace=await loadProductionWorkspace(user.supabaseToken);
        if(alive)applyProductionWorkspace(workspace,user,{notify});
      }catch(err){console.warn("production-live-sync",err);}
    };
    sync(false);
    const id=setInterval(()=>sync(true),5000);
    return()=>{alive=false;clearInterval(id);};
  },[user?.id,user?.supabaseToken]);

  useEffect(()=>{
    if(!isProductionMode()||!user?.supabaseToken)return;
    let cancelled=false,tries=0;
    const register=()=>{
      tries+=1;
      try{
        const nativeToken=window.StepWiseNative?.getFcmToken?.();
        if(nativeToken){
          registerCloudDeviceToken({userId:user.id,token:nativeToken,platform:"android"},user.supabaseToken).catch(err=>console.warn("device-token",err));
          return;
        }
      }catch(err){console.warn("device-token-native",err);}
      if(!cancelled&&tries<8)setTimeout(register,1500);
    };
    register();
    return()=>{cancelled=true;};
  },[user?.id,user?.supabaseToken]);

  const refresh=()=>setAllUsers(DB.users());
  const login=async(u)=>{
    let activeUser=u;
    if(isProductionMode()&&u.supabaseToken){
      try{
        const workspace=await loadProductionWorkspace(u.supabaseToken);
        activeUser=applyProductionWorkspace(workspace,u,{notify:false})||u;
      }catch(err){
        console.warn("production-workspace-load",err);
      }
    }
    setUser(activeUser);saveSession(activeUser);setTab("home");refresh();
  };
  const logout=()=>{setUser(null);clearSession();cancelAllNativeAlarms();setScreen("login");};
  const updateUser=(u)=>{setUser(u);saveSession(u);refresh();};

  // Admin → mobile gets a native-shaped panel, wide screens keep the full web console.
  if(user?.role==="admin") return <>{showSplash&&<StepWiseSplash/>}{isMobileAdmin?<AdminMobilePanel admin={user} onLogout={logout}/>:<AdminPanel admin={user} onLogout={logout}/>}</>;

  const coachTabs=[
    {id:"home",icon:IC.home,label:"Özet"},
    {id:"clients",icon:IC.clients,label:"Danışanlar"},
    {id:"calendar",icon:IC.cal,label:"Takvim"},
    {id:"messages",icon:IC.msg,label:"Mesajlar",badge:unreadCount(user)},
    // Koçlar arası sohbet taslak olarak kodda duruyor; güncelleme ile açılacak.
    {id:"reports",icon:IC.chart,label:"Rapor"},
    {id:"profile",icon:IC.settings,label:"Profil"},
  ];
  const clientTabs=[
    {id:"home",icon:IC.home,label:"Özet"},
    {id:"tasks",icon:IC.target,label:"Görevler",badge:currentPendingCount(user)},
    {id:"calendar",icon:IC.cal,label:"Takvim"},
    {id:"progress",icon:IC.chart,label:"İlerleme"},
    {id:"messages",icon:IC.msg,label:"Koçum",badge:unreadCount(user)},
    {id:"profile",icon:IC.settings,label:"Profil"},
  ];

  const renderContent=()=>{
    if(!user){
      if(screen==="register") return <RegisterScreen onBack={()=>setScreen("login")} onDone={login}/>;
      return <LoginScreen onLogin={login} onRegister={()=>setScreen("register")}/>;
    }
    if(user.role==="coach"){
      if(tab==="home") return <CoachHome user={user} onNav={setTab} allUsers={allUsers}/>;
      if(tab==="clients") return <CoachClients user={user} allUsers={allUsers} onUpdate={refresh}/>;
      if(tab==="calendar") return <CoachCal user={user} allUsers={allUsers}/>;
      if(tab==="messages") return <CoachMsgs user={user} allUsers={allUsers}/>;
      if(tab==="reports") return <CoachReports user={user} allUsers={allUsers}/>;
      if(tab==="profile") return <ProfileScreen user={user} allUsers={allUsers} onUpdate={(u)=>{u&&setUser(u);refresh();}} onLogout={logout}/>;
      return <CoachHome user={user} onNav={setTab} allUsers={allUsers}/>;
    }
    if(user.role==="client"){
      if(tab==="home") return <ClientHome user={user} onNav={setTab} allUsers={allUsers}/>;
      if(tab==="tasks") return <ClientTasks user={user} onUpdate={updateUser}/>;
      if(tab==="calendar") return <ClientCal user={user} allUsers={allUsers}/>;
      if(tab==="progress") return <ClientProgress user={user} allUsers={allUsers}/>;
      if(tab==="messages") return <ClientMsgs user={user} allUsers={allUsers}/>;
      if(tab==="profile") return <ProfileScreen user={user} allUsers={allUsers} onUpdate={(u)=>{u&&setUser(u);refresh();}} onLogout={logout}/>;
      return <ClientHome user={user} onNav={setTab} allUsers={allUsers}/>;
    }
  };

  const activeTabs=user?.role==="coach"?coachTabs:clientTabs;
  const keyboardOpen=useKeyboardOpen();
  const editableFocused=useEditableFocus();
  const showNav=!!user&&!keyboardOpen&&!editableFocused;

  return(
    <div style={{width:"100%",maxWidth:"100vw",height:"100dvh",minHeight:"100vh",background:C.mist,overflowX:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      {showSplash&&<StepWiseSplash/>}
      <div style={{width:"100%",maxWidth:"100vw",height:"100%",background:C.mist,display:"flex",flexDirection:"column",overflow:"hidden",paddingTop:"env(safe-area-inset-top)"}}>
        <ScreenBoundary key={`${user?.id||screen}-${tab}`} onReset={()=>setTab("home")}>
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",overflowX:"hidden",minHeight:0}}>{renderContent()}</div>
        </ScreenBoundary>
        {showNav&&<BotNav tabs={activeTabs} active={tab} onNav={setTab}/>}
      </div>
    </div>
  );
}




