
import { LogViewer } from '@/components/dashboard/log-viewer';
import { ApiSettings } from '@/components/dashboard/api-settings';
import { UnifiedChat } from '@/components/dashboard/unified-chat';
import { UserRoles } from '@/components/dashboard/user-roles';
import { WebsiteViewer } from '@/components/dashboard/website-viewer';
import { FallbackStrategy } from '@/components/dashboard/fallback-strategy';
import { SavedItems } from '@/components/dashboard/saved-items';
import { LoreWeaver } from '@/components/dashboard/lore-weaver';
import { TimeZoneConverter } from '@/components/dashboard/timezone-converter';
import { BotPersonality } from '@/components/dashboard/bot-personality';
import { ImageGenerator } from '@/components/dashboard/image-generator';
import { MusicPlayer } from '@/components/dashboard/music-player';
import { ResumeParser } from '@/components/dashboard/resume-parser';
import { AudioTranscription } from '@/components/dashboard/audio-transcription';
import { Translator } from '@/components/dashboard/translator';
import { CodeHelper } from '@/components/dashboard/code-helper';
import { VideoGenerator } from '@/components/dashboard/video-generator';
import { CustomModule } from '@/components/dashboard/custom-module';
import { SandboxCard } from '@/components/dashboard/sandbox-card';
import { CommandCenterControl } from '@/components/dashboard/command-center-control';

import {
    MessageSquare,
    Smile,
    ShieldCheck,
    BookText,
    Music,
    ImageIcon,
    Video,
    Code,
    FileText,
    FileAudio,
    Languages,
    Clock,
    Shuffle,
    Users,
    Monitor,
    Save,
    ScrollText,
    Puzzle,
    Beaker
} from 'lucide-react';

export const ALL_MODULES_CONFIG = [
    { id: 'unifiedChat', title: 'Unified Chat', component: UnifiedChat, defaultSize: 'col-span-1 lg:col-span-2', icon: MessageSquare },
    { id: 'botPersonality', title: 'Bot Personality', component: BotPersonality, defaultSize: 'col-span-1', icon: Smile },
    { id: 'apiSettings', title: 'API Key Vault', component: ApiSettings, defaultSize: 'col-span-1', icon: ShieldCheck },
    { id: 'logViewer', title: 'Captain\'s Log', component: LogViewer, defaultSize: 'col-span-1 lg:col-span-2', icon: BookText },
    { id: 'musicPlayer', title: 'Subspace Comms & Music', component: MusicPlayer, defaultSize: 'col-span-1', icon: Music },
    { id: 'imageGenerator', title: 'Stargate Imagery', component: ImageGenerator, defaultSize: 'col-span-1', icon: ImageIcon },
    { id: 'videoGenerator', title: 'Avatar Forge', component: VideoGenerator, defaultSize: 'col-span-1', icon: Video },
    { id: 'codeHelper', title: 'Cipher (Code Helper)', component: CodeHelper, defaultSize: 'col-span-1', icon: Code },
    { id: 'resumeParser', title: 'Resume Parser', component: ResumeParser, defaultSize: 'col-span-1', icon: FileText },
    { id: 'audioTranscription', title: 'Audio Transcription', component: AudioTranscription, defaultSize: 'col-span-1', icon: FileAudio },
    { id: 'translator', title: 'Translator', component: Translator, defaultSize: 'col-span-1', icon: Languages },
    { id: 'timeZoneConverter', title: 'Time Zone Converter', component: TimeZoneConverter, defaultSize: 'col-span-1', icon: Clock },
    { id: 'fallbackStrategy', title: 'Fallback Strategy', component: FallbackStrategy, defaultSize: 'col-span-1', icon: Shuffle },
    { id: 'userRoles', title: 'Access Control', component: UserRoles, defaultSize: 'col-span-1', icon: Users },
    { id: 'websiteViewer', title: 'Website Viewer', component: WebsiteViewer, defaultSize: 'col-span-1 lg:col-span-2', icon: Monitor },
    { id: 'savedItems', title: 'Saved Items', component: SavedItems, defaultSize: 'col-span-1 lg:col-span-2', icon: Save },
    { id: 'loreWeaver', title: 'Lore Weaver', component: LoreWeaver, defaultSize: 'col-span-1', icon: ScrollText },
    { id: 'sandboxCard', title: 'AI Sandbox', component: SandboxCard, defaultSize: 'col-span-1', icon: Beaker },
    { id: 'customModule', title: 'Custom Module', component: CustomModule, defaultSize: 'col-span-1', icon: Puzzle },
];
