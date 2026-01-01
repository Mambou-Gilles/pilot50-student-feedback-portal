document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("feedbackForm");
    const resultDiv = document.getElementById("result");
    const weekSelect = document.getElementById("week");

    // 1. Populate Weeks (1 to 16)
    for (let i = 1; i <= 16; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.text = `Week ${i}`;
        weekSelect.appendChild(opt);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const cohort = document.getElementById("cohort").value;
        const pathwayID = document.getElementById("pathwayID").value.trim();
        const week = parseInt(weekSelect.value);

        // Loading State with a professional spinner
        resultDiv.innerHTML = `
            <div class="flex flex-col justify-center items-center py-20 space-y-4">
                <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
                <p class="text-slate-500 font-medium tracking-wide">Accessing Secure Records...</p>
            </div>`;
        resultDiv.classList.remove("hidden");

        try {
            // CALLING NETLIFY FUNCTION INSTEAD OF GOOGLE DIRECTLY
            const response = await fetch(`/.netlify/functions/getFeedback?cohort=${encodeURIComponent(cohort)}`);
            
            if (!response.ok) throw new Error("Failed to connect to the secure server.");
            
            const data = await response.json();

            if (data.error) throw new Error(data.error);

            // Logic to handle different naming conventions in JSON keys if necessary
            const match = data.find(item => {
                // Ensure we compare IDs correctly regardless of them being strings or numbers
                const itemID = item.pathwayID || item["Student BYU-Pathway student ID Number"];
                const itemWeek = item.weekNumber || item["Week Number"];
                
                return String(itemID).trim() === String(pathwayID).trim() && 
                       parseInt(itemWeek) === week;
            });

            if (match) {
                renderProfessionalUI(match);
            } else {
                resultDiv.innerHTML = `
                    <div class="animate-popIn bg-white border border-orange-100 p-8 rounded-3xl shadow-xl text-center">
                        <div class="text-5xl mb-4">🔍</div>
                        <h3 class="text-xl font-bold text-slate-800">No Record Found</h3>
                        <p class="text-slate-500 mt-2">We couldn't find feedback for ID <b>${pathwayID}</b> in <b>${cohort}</b> for <b>Week ${week}</b>.</p>
                        <p class="text-sm text-slate-400 mt-4">Please verify your ID or contact your Team Lead.</p>
                    </div>`;
            }
        } catch (err) {
            resultDiv.innerHTML = `
                <div class="bg-red-50 border border-red-100 p-6 rounded-2xl text-red-700">
                    <b>System Error:</b> ${err.message}
                </div>`;
        }
    });

    function renderProfessionalUI(match) {
        // --- AVERAGE CALCULATION LOGIC ---
        const scores = [
            parseFloat(match.scores.quality.score) || 0,
            parseFloat(match.scores.completeness.score) || 0,
            parseFloat(match.scores.engagement.score) || 0,
            parseFloat(match.scores.adherence.score) || 0
        ];
        const average = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
        
        // Color logic for the average badge
        let avgColor = "text-red-500";
        if (average >= 4.0) avgColor = "text-emerald-600";
        else if (average >= 3.0) avgColor = "text-amber-500";

        resultDiv.innerHTML = `
            <div class="animate-popIn space-y-10">
                <div class="bg-white rounded-3xl p-8 shadow-xl shadow-blue-100 border border-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                    <div class="relative z-10">
                        <div class="flex items-center gap-3">
                             <span class="bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Student Profile</span>
                             <button onclick="window.print()" class="flex items-center px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-[10px] font-bold transition">
                                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                SAVE PDF
                             </button>
                        </div>
                        <h2 class="text-3xl font-extrabold text-slate-900 mt-2">${match.studentName}</h2>
                        <div class="flex items-center space-x-4 mt-2 text-slate-500">
                            <span class="flex items-center"><svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> ID: ${match.pathwayID}</span>
                            <span class="flex items-center"><svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> ${match.submitted === 'Yes' ? 'Evaluation Completed' : 'Missing Evaluation'}</span>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-8 relative z-10">
                        <div class="text-right">
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Career Coach</p>
                            <p class="font-bold text-slate-800">${match.careerCoach}</p>
                        </div>
                        <div class="text-right border-l pl-8 border-slate-100">
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Lead</p>
                            <p class="font-bold text-slate-800">${match.teamLead}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <div class="flex justify-between items-end mb-6 px-2">
                        <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest italic leading-none">Performance Metrics (Click to flip)</h3>
                        <div class="text-right leading-none">
                            <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Weekly Average</p>
                            <div class="flex items-center justify-end space-x-1">
                                <span class="text-4xl font-black ${avgColor}">${average}</span>
                                <span class="text-slate-300 font-light text-xl">/ 5.0</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        ${createFlipCard("Response Quality", match.scores.quality, "text-blue-600", "bg-blue-600", 
                            "Thoughtful, well-articulated answers that reflect your learning.")}
                            
                        ${createFlipCard("Task Completion", match.scores.completeness, "text-indigo-600", "bg-indigo-600", 
                            "Answering all required questions and completing assigned tasks.")}
                            
                        ${createFlipCard("Engagement", match.scores.engagement, "text-violet-600", "bg-violet-600", 
                            "Demonstrating effort, critical thinking, and enthusiasm.")}
                            
                        ${createFlipCard("Adherence", match.scores.adherence, "text-sky-600", "bg-sky-600", 
                            "Following instructions, including formatting and content requirements.")}
                    </div>
                </div>

                <div class="bg-slate-900 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-10 opacity-10">
                        <svg width="100" height="100" fill="white" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.154c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
                    </div>
                    <div class="relative z-10">
                        <h4 class="text-blue-400 font-bold uppercase tracking-widest text-xs mb-4">Coach's Deep Dive</h4>
                        <p class="text-xl md:text-2xl leading-relaxed font-light text-slate-200 italic">
                            "${match.generalFeedback || 'No general comments provided for this session.'}"
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    function createFlipCard(title, data, textColor, bgColor, definition) {
    return `
        <div class="flip-card group" onclick="this.classList.toggle('flipped')">
            <div class="flip-card-inner">
                <div class="flip-card-front bg-white shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300 group-hover:border-blue-300 group-hover:shadow-blue-100">
                    <div class="w-12 h-1 mb-4 rounded-full ${bgColor} opacity-40"></div>
                    
                    <div class="flex justify-between items-start">
                        <p class="text-[10px] font-black uppercase tracking-tighter text-slate-400 leading-tight">${title}</p>
                        
                        <div class="relative group/tip">
                            <button type="button" class="text-slate-300 hover:text-blue-500 transition-colors p-1 -mt-1 -mr-1">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                                </svg>
                            </button>
                            
                            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/tip:block w-56 bg-slate-900 text-white rounded-xl p-3 shadow-2xl z-[100] pointer-events-none">
                                <p class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Definition</p>
                                <p class="text-[11px] leading-snug font-medium text-slate-200">${definition}</p>
                                <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                            </div>
                        </div>
                    </div>

                    <h4 class="text-6xl font-black mt-4 mb-2 ${textColor} tracking-tight">${data.score}</h4>
                    
                    <div class="mt-auto flex items-center text-[9px] font-bold text-slate-400 group-hover:text-blue-600 transition">
                        VIEW REASONING <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>

                <div class="flip-card-back shadow-2xl flex flex-col items-start text-left">
                    <span class="${bgColor} text-white text-[9px] font-bold px-2 py-0.5 rounded mb-4 uppercase tracking-widest">Coach's Comments</span>
                    <p class="text-xs text-slate-600 leading-relaxed overflow-y-auto pr-2 font-medium italic">
                        "${data.reason || 'No specific comments provided.'}"
                    </p>
                </div>
            </div>
        </div>
    `;
}
});

function toggleResources() {
    const modal = document.getElementById('resourcesModal');
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Stop scrolling background
    } else {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    }
}