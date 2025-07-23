
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
import { CommandCenterControl } from '@/components/dashboard/command-center-control';

export const ALL_MODULES_CONFIG = [
    { id: 'commandCenterControl', title: 'Command Center Control', component: CommandCenterControl, defaultSize: 'col-span-1 lg:col-span-2' },
    { id: 'unifiedChat', title: 'Unified Chat', component: UnifiedChat, defaultSize: 'col-span-1 lg:col-span-2' },
    { id: 'botPersonality', title: 'Bot Personality', component: BotPersonality, defaultSize: 'col-span-1' },
    { id: 'apiSettings', title: 'API Key Vault', component: ApiSettings, defaultSize: 'col-span-1' },
    { id: 'logViewer', title: 'Captain\'s Log', component: LogViewer, defaultSize: 'col-span-1 lg:col-span-2' },
    { id: 'musicPlayer', title: 'Subspace Comms & Music', component: MusicPlayer, defaultSize: 'col-span-1' },
    { id: 'imageGenerator', title: 'Stargate Imagery', component: ImageGenerator, defaultSize: 'col-span-1' },
    { id: 'videoGenerator', title: 'Avatar Forge', component: VideoGenerator, defaultSize: 'col-span-1' },
    { id: 'codeHelper', title: 'Cipher (Code Helper)', component: CodeHelper, defaultSize: 'col-span-1' },
    { id: 'resumeParser', title: 'Resume Parser', component: ResumeParser, defaultSize: 'col-span-1' },
    { id: 'audioTranscription', title: 'Audio Transcription', component: AudioTranscription, defaultSize: 'col-span-1' },
    { id: 'translator', title: 'Translator', component: Translator, defaultSize: 'col-span-1' },
    { id: 'timeZoneConverter', title: 'Time Zone Converter', component: TimeZoneConverter, defaultSize: 'col-span-1' },
    { id: 'fallbackStrategy', title: 'Fallback Strategy', component: FallbackStrategy, defaultSize: 'col-span-1'},
    { id: 'userRoles', title: 'Access Control', component: UserRoles, defaultSize: 'col-span-1' },
    { id: 'websiteViewer', title: 'Website Viewer', component: WebsiteViewer, defaultSize: 'col-span-1 lg:col-span-2' },
    { id: 'savedItems', title: 'Saved Items', component: SavedItems, defaultSize: 'col-span-1 lg:col-span-2' },
    { id: 'loreWeaver', title: 'Lore Weaver', component: LoreWeaver, defaultSize: 'col-span-1' },
    { id: 'customModule', title: 'Custom Module', component: CustomModule, defaultSize: 'col-span-1' },
];

    