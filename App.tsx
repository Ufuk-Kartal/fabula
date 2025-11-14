// FIX: Import `useMemo` from 'react' to resolve the "Cannot find name" error.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Author, Sentence, StoryBranch, SentenceStatus, StoryData, Vote, Badge, StoryEvent } from './types';
import { SentenceCard } from './components/SentenceCard';
import { NewSentenceForm } from './components/NewSentenceForm';
import { UserProfile } from './components/UserProfile';
import { Leaderboard } from './components/Leaderboard';
import { UniverseMap } from './components/UniverseMap';
import { ChartBarIcon } from './components/icons/ChartBarIcon';
import { MapIcon } from './components/icons/MapIcon';
import { EventBanner } from './components/EventBanner';
import { StarIcon } from './components/icons/StarIcon';
import { LoginForm } from './components/LoginForm';
import { StorySummary } from './components/StorySummary';
import { generateBranchSummary, generateBranchTitle, generateSummaryTitle } from './services/geminiService';

const WINNING_VOTE_COUNT = 5;
const VOTING_DURATION_HOURS = 12;
const DAILY_VOTE_LIMIT = 5;

// --- Initial Data Simulation ---
const genesis_cumle_id = 'genesis-sentence-1';
const genesis_dal_id = 'genesis-branch-1';
const event_1_id = 'event-kristal-kalp';
const event_1_dal_id = 'event-branch-1';
const event_1_cumle_id = 'event-sentence-1';


const initialData: StoryData = {
    authors: [
        { yazar_id: 'SISTEM', kullanici_adi: 'Evrenin Ozu', toplam_kazanis: 2, toplam_gonderilen_cumle: 2 },
        { yazar_id: 'user-1', kullanici_adi: 'Gezgin', toplam_kazanis: 0, toplam_gonderilen_cumle: 0 },
        { yazar_id: 'user-2', kullanici_adi: 'Kaşif', toplam_kazanis: 0, toplam_gonderilen_cumle: 0 }
    ],
    branches: [
        { dal_id: genesis_dal_id, baslik: 'Fabula Efsanesinin Başlangıcı', kaynak_cumle_id: genesis_cumle_id },
        { dal_id: event_1_dal_id, baslik: 'Kristal Kalp Ormanı', kaynak_cumle_id: event_1_cumle_id, etkinlik_id: event_1_id }
    ],
    sentences: [
        {
            cumle_id: genesis_cumle_id,
            dal_id: genesis_dal_id,
            ebeveyn_cumle_id: null,
            yazar_id: 'SISTEM',
            metin: 'Gümüş rengi bir çölün ortasında, kumdan değil, külden yapılmış tek bir kule yükseliyordu.',
            gonderme_zamani: new Date(),
            toplam_oy: 0,
            durum: SentenceStatus.APPROVED
        },
        {
            cumle_id: event_1_cumle_id,
            dal_id: event_1_dal_id,
            ebeveyn_cumle_id: null,
            yazar_id: 'SISTEM',
            metin: 'Yosunların fısıldadığı, ağaçların kadim sırlar sakladığı o ormanda, her adımda yerdeki kristaller belli belirsiz bir melodiyle çınlıyordu.',
            gonderme_zamani: new Date(),
            toplam_oy: 0,
            durum: SentenceStatus.APPROVED,
            etkinlik_id: event_1_id
        }
    ],
    votes: [],
    badges: [],
    events: [
        {
            etkinlik_id: event_1_id,
            baslik: "Kristal Kalp'in Fısıltısı",
            aciklama: "Bu gizemli ormanın kalbindeki sırrı ortaya çıkarın. Bu macerada yolu aydınlatan ilk kaşif, eşsiz 'Kristal Kaşifi' rozetini kazanacak!",
            aktif: true,
            baslangic_dal_id: event_1_dal_id,
            rozet_adi: 'Kristal Kaşifi'
        }
    ]
};

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const badgeDefinitions = {
    'İlk Katkı': {
        description: 'İlk cümleni göndererek hikayeye dahil oldun.',
        condition: (author: Author) => author.toplam_gonderilen_cumle >= 1
    },
    'Hikaye Başlatan': {
        description: 'İlk cümlen oylamayı kazanarak yeni bir yol açtı.',
        condition: (author: Author) => author.toplam_kazanis >= 1
    },
    'Üretken Yazar': {
        description: 'Hikayeye 5 cümle katkısında bulundun.',
        condition: (author: Author) => author.toplam_gonderilen_cumle >= 5
    },
    'Efsane Anlatıcı': {
        description: '3 cümlen oylamayı kazanarak efsaneleşti.',
        condition: (author: Author) => author.toplam_kazanis >= 3
    }
};


const App: React.FC = () => {
    const [storyData, setStoryData] = useState<StoryData>(() => {
        try {
            const savedData = localStorage.getItem('fabulaUniverseData');
            if (savedData) {
                const parsedData: StoryData = JSON.parse(savedData);
                // Convert date strings back to Date objects
                parsedData.sentences.forEach(s => s.gonderme_zamani = new Date(s.gonderme_zamani));
                parsedData.badges.forEach(b => b.kazanma_zamani = new Date(b.kazanma_zamani));
                if (parsedData.votes) {
                    parsedData.votes.forEach(v => {
                        if (v.oy_zamani) v.oy_zamani = new Date(v.oy_zamani);
                    });
                }
                if (!parsedData.events) parsedData.events = []; // backwards compatibility
                return parsedData;
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
        }
        return initialData;
    });

    useEffect(() => {
        try {
            localStorage.setItem('fabulaUniverseData', JSON.stringify(storyData));
        } catch (error) {
            console.error("Failed to save data to localStorage", error);
        }
    }, [storyData]);
    
    const [activeBranchId, setActiveBranchId] = useState<string>(genesis_dal_id);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [path, setPath] = useState<Sentence[]>([]);
    const [votingStates, setVotingStates] = useState<Record<string, boolean>>({});
    const [filterStatus, setFilterStatus] = useState<SentenceStatus | 'ALL'>('ALL');
    const [justVotedSentenceId, setJustVotedSentenceId] = useState<string | null>(null);
    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [branchSummary, setBranchSummary] = useState<string | null>(null);
    const [summaryTitle, setSummaryTitle] = useState<string | null>(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);
    const [isProcessingVotes, setIsProcessingVotes] = useState(false);

    // Automatically reject sentences that have timed out
    useEffect(() => {
        const voteCheckInterval = setInterval(() => {
            setStoryData(currentStoryData => {
                const now = new Date();
                let changesMade = false;

                const updatedSentences = currentStoryData.sentences.map(sentence => {
                    if (sentence.durum === SentenceStatus.VOTING) {
                        const submissionTime = new Date(sentence.gonderme_zamani).getTime();
                        const hoursPassed = (now.getTime() - submissionTime) / (1000 * 60 * 60);

                        if (hoursPassed > VOTING_DURATION_HOURS && sentence.toplam_oy < WINNING_VOTE_COUNT) {
                            changesMade = true;
                            return { ...sentence, durum: SentenceStatus.REJECTED };
                        }
                    }
                    return sentence;
                });

                if (changesMade) {
                    return {
                        ...currentStoryData,
                        sentences: updatedSentences,
                    };
                }

                return currentStoryData; // Return original state if no changes to prevent re-render
            });
        }, 60 * 1000); // Check every minute

        return () => clearInterval(voteCheckInterval);
    }, []); // Empty dependency array ensures this runs only once on mount

    const isLoggedIn = !!currentUserId;

    const getAuthorById = useCallback((id: string) => storyData.authors.find(a => a.yazar_id === id), [storyData.authors]);

    const checkAndAwardBadges = (author: Author, currentBadges: Badge[]): Badge[] => {
        const newBadges: Badge[] = [];
        const userBadgeNames = currentBadges.filter(b => b.kullanici_id === author.yazar_id).map(b => b.rozet_adi);

        for (const [badgeName, def] of Object.entries(badgeDefinitions)) {
            if (!userBadgeNames.includes(badgeName) && def.condition(author)) {
                newBadges.push({
                    rozet_id: generateUUID(),
                    kullanici_id: author.yazar_id,
                    rozet_adi: badgeName,
                    kazanma_zamani: new Date()
                });
            }
        }
        return newBadges;
    };

    useEffect(() => {
        const activeBranch = storyData.branches.find(b => b.dal_id === activeBranchId);
        if (!activeBranch) return;

        let currentPath: Sentence[] = [];
        let currentSentence = storyData.sentences.find(s => s.cumle_id === activeBranch.kaynak_cumle_id);
        
        while(currentSentence) {
            currentPath.unshift(currentSentence);
            if (currentSentence.ebeveyn_cumle_id) {
                currentSentence = storyData.sentences.find(s => s.cumle_id === currentSentence!.ebeveyn_cumle_id);
            } else {
                currentSentence = undefined;
            }
        }
        setPath(currentPath);
        setBranchSummary(null);
        setSummaryError(null);
        setSummaryTitle(null);
    }, [activeBranchId, storyData.branches, storyData.sentences]);

    const votesToday = useMemo(() => {
        if (!currentUserId) return 0;
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        return storyData.votes.filter(
            v => v.kullanici_id === currentUserId && v.oy_zamani && new Date(v.oy_zamani) >= startOfDay
        ).length;
    }, [storyData.votes, currentUserId]);

    const votesRemaining = DAILY_VOTE_LIMIT - votesToday;

    const handleVote = (sentenceId: string) => {
        if (!currentUserId || votesRemaining <= 0) return;

        const alreadyVoted = storyData.votes.some(v => v.kullanici_id === currentUserId && v.cumle_id === sentenceId);
        if (alreadyVoted || votingStates[sentenceId]) return;

        setVotingStates(prev => ({...prev, [sentenceId]: true}));

        setStoryData(prevData => {
            const sentence = prevData.sentences.find(s => s.cumle_id === sentenceId);
            if (!sentence) return prevData;

            const newVote: Vote = { 
                oy_id: generateUUID(), 
                kullanici_id: currentUserId, 
                cumle_id: sentenceId,
                oy_zamani: new Date() 
            };
            const updatedSentence = { ...sentence, toplam_oy: sentence.toplam_oy + 1 };
            
            return {
                ...prevData,
                sentences: prevData.sentences.map(s => s.cumle_id === sentenceId ? updatedSentence : s),
                votes: [...prevData.votes, newVote]
            };
        });
        
        setJustVotedSentenceId(sentenceId);

        setTimeout(() => {
            setVotingStates(prev => ({...prev, [sentenceId]: false}));
            setJustVotedSentenceId(null);
        }, 500);
    };

    const handleNewSentenceSubmit = (parentSentenceId: string, text: string) => {
        if (!currentUserId) return;
        const parentSentence = storyData.sentences.find(s => s.cumle_id === parentSentenceId);
        if (!parentSentence) return;
        
        const newSentence: Sentence = {
            cumle_id: generateUUID(),
            dal_id: parentSentence.dal_id,
            ebeveyn_cumle_id: parentSentenceId,
            yazar_id: currentUserId,
            metin: text,
            gonderme_zamani: new Date(),
            toplam_oy: 0,
            durum: SentenceStatus.VOTING,
            etkinlik_id: parentSentence.etkinlik_id || null // Inherit event ID
        };

        setStoryData(prevData => {
            const updatedAuthors = prevData.authors.map(a => 
                a.yazar_id === currentUserId 
                ? { ...a, toplam_gonderilen_cumle: a.toplam_gonderilen_cumle + 1 }
                : a
            );
            
            const currentUserAuthor = updatedAuthors.find(a => a.yazar_id === currentUserId)!;
            const newBadges = checkAndAwardBadges(currentUserAuthor, prevData.badges);

            return {
                ...prevData,
                sentences: [...prevData.sentences, newSentence],
                authors: updatedAuthors,
                badges: [...prevData.badges, ...newBadges]
            }
        });
    };
    
    const handleNavigateFromMap = (branchId: string) => {
        setActiveBranchId(branchId);
        setIsMapOpen(false);
    };
    
    const handleLogin = (username: string): boolean => {
        const user = storyData.authors.find(
          (author) => author.kullanici_adi.toLowerCase() === username.toLowerCase()
        );
        if (user) {
          setCurrentUserId(user.yazar_id);
          return true;
        }
        return false;
    };

    const processVoting = async () => {
        setIsProcessingVotes(true);
        try {
            const now = new Date();
            let changesMade = false;

            const newData: StoryData = JSON.parse(JSON.stringify(storyData));
            newData.sentences.forEach(s => s.gonderme_zamani = new Date(s.gonderme_zamani));
            newData.badges.forEach(b => b.kazanma_zamani = new Date(b.kazanma_zamani));
            if (newData.votes) {
                newData.votes.forEach(v => {
                    if (v.oy_zamani) v.oy_zamani = new Date(v.oy_zamani);
                });
            }

            // 1. Reject timed-out sentences
            newData.sentences.forEach(s => {
                if (s.durum === SentenceStatus.VOTING) {
                    const sentTime = new Date(s.gonderme_zamani).getTime();
                    const hoursPassed = (now.getTime() - sentTime) / (1000 * 60 * 60);
                    if (hoursPassed > VOTING_DURATION_HOURS && s.toplam_oy < WINNING_VOTE_COUNT) {
                        s.durum = SentenceStatus.REJECTED;
                        changesMade = true;
                    }
                }
            });

            // 2. Find potential winners from non-timed-out sentences
            const potentialWinners = newData.sentences.filter(s =>
                s.durum === SentenceStatus.VOTING && s.toplam_oy >= WINNING_VOTE_COUNT
            );

            if (potentialWinners.length === 0) {
                if (changesMade) {
                    setStoryData(newData);
                } else {
                    alert("Sonuçlandırılacak oylama bulunamadı.");
                }
                return;
            }
            
            changesMade = true;

            // 3. Group by parent and select the single best winner for each
            const groupedByParent = potentialWinners.reduce<Record<string, Sentence[]>>((acc, sentence) => {
                const parentId = sentence.ebeveyn_cumle_id!;
                if (!acc[parentId]) acc[parentId] = [];
                acc[parentId].push(sentence);
                return acc;
            }, {});

            const trueWinners: Sentence[] = [];
            Object.values(groupedByParent).forEach(group => {
                group.sort((a, b) => {
                    // Tie-breaker 1: Higher vote count wins.
                    if (b.toplam_oy !== a.toplam_oy) {
                        return b.toplam_oy - a.toplam_oy;
                    }
                    // Tie-breaker 2: Earliest submission wins.
                    return new Date(a.gonderme_zamani).getTime() - new Date(b.gonderme_zamani).getTime();
                });

                const winner = group[0];
                trueWinners.push(winner);
                
                for (let i = 1; i < group.length; i++) {
                    const loser = newData.sentences.find(s => s.cumle_id === group[i].cumle_id);
                    if (loser) loser.durum = SentenceStatus.REJECTED;
                }
            });

            // 4. Generate titles and prepare new data for the true winners
            const newBranchDataPromises = trueWinners.map(async (winner) => {
                const title = await generateBranchTitle(winner.metin);
                return { 
                    winner, 
                    newBranch: {
                        dal_id: generateUUID(),
                        baslik: title,
                        kaynak_cumle_id: winner.cumle_id,
                        etkinlik_id: winner.etkinlik_id
                    } as StoryBranch
                };
            });

            const allNewBranchData = await Promise.all(newBranchDataPromises);
            
            // 5. Apply winning changes to the newData object
            let newlyAwardedBadges: Badge[] = [];
            allNewBranchData.forEach(({ winner, newBranch }) => {
                const sentence = newData.sentences.find(s => s.cumle_id === winner.cumle_id);
                if (sentence) {
                    sentence.durum = SentenceStatus.APPROVED;
                    newData.branches.push(newBranch);

                    const author = newData.authors.find(a => a.yazar_id === winner.yazar_id);
                    if (author) {
                        author.toplam_kazanis += 1;
                        const regularBadges = checkAndAwardBadges(author, [...newData.badges, ...newlyAwardedBadges]);
                        newlyAwardedBadges.push(...regularBadges);

                        if(winner.etkinlik_id) {
                            const event = newData.events.find(e => e.etkinlik_id === winner.etkinlik_id);
                            const hasEventBadge = [...newData.badges, ...newlyAwardedBadges].some(b => b.kullanici_id === author.yazar_id && b.rozet_adi === event?.rozet_adi);
                            if(event && !hasEventBadge) {
                                newlyAwardedBadges.push({
                                    rozet_id: generateUUID(),
                                    kullanici_id: author.yazar_id,
                                    rozet_adi: event.rozet_adi,
                                    kazanma_zamani: new Date()
                                });
                            }
                        }
                    }
                }
            });
            
            if (newlyAwardedBadges.length > 0) {
                newData.badges.push(...newlyAwardedBadges);
            }
            
            setStoryData(newData);

        } catch (error) {
            console.error("Failed to process voting:", error);
            alert("Oylama sonuçlandırılırken bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setIsProcessingVotes(false);
        }
    };

    const handleGenerateSummary = async () => {
        setIsSummaryLoading(true);
        setSummaryError(null);
        setBranchSummary(null);
        setSummaryTitle(null);
        
        const storyText = path.map(s => s.metin).join(' ');
        if (path.length <= 1) {
            setSummaryError("Özet oluşturmak için bu yolda yeterli hikaye yok.");
            setIsSummaryLoading(false);
            return;
        }

        try {
            const summary = await generateBranchSummary(storyText);
            if(summary.toLowerCase().includes('error') || summary.toLowerCase().includes('disabled')) {
                 setSummaryError(summary);
                 setBranchSummary(null);
            } else {
                 setBranchSummary(summary);
                 const title = await generateSummaryTitle(summary);
                 setSummaryTitle(title);
            }
        } catch (error) {
            console.error("Summary generation failed:", error);
            setSummaryError("Özet oluşturulurken bir hata oluştu.");
        } finally {
            setIsSummaryLoading(false);
        }
    };

    const activeBranch = storyData.branches.find(b => b.dal_id === activeBranchId);
    const lastPathSentence = path.length > 0 ? path[path.length - 1] : null;
    const continuations = lastPathSentence
      ? storyData.sentences.filter(s => s.ebeveyn_cumle_id === lastPathSentence.cumle_id)
      : [];
    const filteredContinuations = continuations.filter(sentence => 
        filterStatus === 'ALL' || sentence.durum === filterStatus
    );
    const userVotes = currentUserId ? storyData.votes.filter(v => v.kullanici_id === currentUserId).map(v => v.cumle_id) : [];

    const currentUser = currentUserId ? storyData.authors.find(a => a.yazar_id === currentUserId) : null;
    const currentUserBadges = currentUserId ? storyData.badges.filter(b => b.kullanici_id === currentUserId) : [];
    
    const activeEvent = storyData.events?.find(e => e.aktif);

    const FilterButton = ({ label, status }: { label: string; status: SentenceStatus | 'ALL' }) => {
        const isActive = filterStatus === status;
        return (
            <button
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActive
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
            >
                {label}
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-6 lg:p-8">
             {isLeaderboardOpen && (
                <Leaderboard 
                    authors={storyData.authors} 
                    currentUserId={currentUserId} 
                    onClose={() => setIsLeaderboardOpen(false)} 
                />
            )}
            {isMapOpen && (
                <UniverseMap
                    branches={storyData.branches}
                    sentences={storyData.sentences}
                    activeBranchId={activeBranchId}
                    onNavigateToBranch={handleNavigateFromMap}
                    onClose={() => setIsMapOpen(false)}
                />
            )}

            <div className="max-w-4xl mx-auto">
                <header className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Fabula Evreni</h1>
                        <p className="text-gray-400 mt-2">Hikayeyi sen şekillendir.</p>
                         <div className="flex gap-2 mt-4">
                            <button onClick={() => setIsLeaderboardOpen(true)} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md transition">
                                <ChartBarIcon className="w-4 h-4" /> Liderlik Tablosu
                            </button>
                            <button onClick={() => setIsMapOpen(true)} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md transition">
                                <MapIcon className="w-4 h-4" /> Evren Haritası
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                        {isLoggedIn && currentUser ? (
                            <>
                                <UserProfile 
                                    user={currentUser} 
                                    badges={currentUserBadges} 
                                    votesRemaining={votesRemaining}
                                    dailyVoteLimit={DAILY_VOTE_LIMIT}
                                />
                                <button onClick={() => setCurrentUserId(null)} className="self-start px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition">Çıkış Yap</button>
                            </>
                        ) : (
                           <LoginForm onLogin={handleLogin} />
                        )}
                    </div>
                </header>
                
                {activeEvent && (
                    <EventBanner 
                        event={activeEvent} 
                        onNavigate={(branchId) => setActiveBranchId(branchId)} 
                    />
                )}

                <div className="bg-black/20 p-4 rounded-lg mb-6 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         {activeBranch?.etkinlik_id && <StarIcon className="w-6 h-6 text-yellow-400" title="Bu bir etkinlik yoludur" />}
                        <h2 className="text-xl font-semibold text-indigo-300">{activeBranch?.baslik}</h2>
                    </div>
                    <button
                        onClick={processVoting}
                        disabled={isProcessingVotes}
                        className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 transition disabled:bg-purple-900 disabled:cursor-not-allowed"
                    >
                        {isProcessingVotes ? 'Sonuçlandırılıyor...' : 'Oylamayı Sonuçlandır'}
                    </button>
                </div>

                <StorySummary
                    summary={branchSummary}
                    summaryTitle={summaryTitle}
                    isLoading={isSummaryLoading}
                    error={summaryError}
                    onGenerate={handleGenerateSummary}
                />

                <div className="space-y-4">
                    {path.map((sentence, index) => (
                        <div key={sentence.cumle_id} className="pl-4 border-l-2 border-gray-700">
                           <p className="text-gray-500">{getAuthorById(sentence.yazar_id)?.kullanici_adi}:</p>
                           <p className={`text-lg ${index === path.length - 1 ? 'text-white font-semibold' : 'text-gray-400'}`}>{sentence.metin}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t-2 border-indigo-500/30">
                    <h3 className="text-lg font-semibold text-gray-300 mb-4">Hikayenin gidişatını belirle:</h3>
                    
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        <FilterButton label="Tümü" status={'ALL'} />
                        <FilterButton label="Oylanıyor" status={SentenceStatus.VOTING} />
                        <FilterButton label="Onaylandı" status={SentenceStatus.APPROVED} />
                        <FilterButton label="Reddedildi" status={SentenceStatus.REJECTED} />
                    </div>

                    {filteredContinuations.length > 0 ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredContinuations.map(sentence => {
                                const childBranch = storyData.branches.find(b => b.kaynak_cumle_id === sentence.cumle_id);
                                return (
                                    <SentenceCard
                                        key={sentence.cumle_id}
                                        sentence={sentence}
                                        author={getAuthorById(sentence.yazar_id)}
                                        isLoggedIn={isLoggedIn}
                                        canVote={isLoggedIn && sentence.yazar_id !== currentUserId}
                                        votesRemaining={votesRemaining}
                                        hasVoted={userVotes.includes(sentence.cumle_id)}
                                        onVote={handleVote}
                                        onSubmitNewSentence={handleNewSentenceSubmit}
                                        onNavigateToBranch={(branchId) => setActiveBranchId(branchId)}
                                        childBranchId={childBranch?.dal_id}
                                        isVoting={!!votingStates[sentence.cumle_id]}
                                        justVoted={justVotedSentenceId === sentence.cumle_id}
                                        votingDurationHours={VOTING_DURATION_HOURS}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            {continuations.length > 0 && filteredContinuations.length === 0 ? (
                                <p>Bu filtreyle eşleşen devam cümlesi bulunamadı.</p>
                            ) : (
                                <>
                                    <p>Bu yolun sonuna gelindi.</p>
                                    <p className="mt-1">Yeni bir başlangıç için bir cümle ekle.</p>
                                </>
                            )}
                        </div>
                    )}
                    
                    {lastPathSentence && lastPathSentence.durum === SentenceStatus.APPROVED && continuations.length === 0 && (
                         <div className="mt-6">
                            <NewSentenceForm
                                isLoggedIn={isLoggedIn}
                                parentSentenceText={lastPathSentence.metin} 
                                onSubmit={(text) => handleNewSentenceSubmit(lastPathSentence.cumle_id, text)}
                            />
                         </div>
                    )}
                </div>
                
                 {activeBranchId !== genesis_dal_id && !path.some(s => s.etkinlik_id) && (
                    <div className="mt-8 text-center">
                        <button onClick={() => setActiveBranchId(genesis_dal_id)} className="text-indigo-400 hover:text-indigo-300 transition">
                            &larr; Ana Hikayeye Dön
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;