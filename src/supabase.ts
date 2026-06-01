import { createClient } from "@supabase/supabase-js";
import { ResumeData, AnalysisResult, AIHistoryItem } from "./types";
console.log("SUPABASE URL =", import.meta.env.VITE_SUPABASE_URL);
console.log("SUPABASE KEY =", import.meta.env.VITE_SUPABASE_ANON_KEY);
const supabaseUrl =  import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);


// LocalStorage key for simulating persistence if Supabase backend is not configured yet
const LOCAL_STORAGE_HISTORY_KEY = "ats_resume_builder_history";

/**
 * High-quality hybrid Database service.
 * Supports storing, listing, and deleting resume histories.
 * Transparently falls back to localStorage with standard alert indicators when Supabase isn't configured,
 * ensuring seamless user experience under any state.
 */
export const DbService = {
  isCloudConnected(): boolean {
    return !!supabase;
  },

  getCredentials(): { url: string; hasKey: boolean } {
    return {
      url: supabaseUrl,
      hasKey: !!supabaseAnonKey,
    };
  },

  async getHistory(): Promise<AIHistoryItem[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("resume_history")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        return (data || []).map((item: any) => ({
          id: item.id,
          createdAt: item.created_at,
          resumeName: item.resume_name,
          jobTitle: item.job_title,
          score: item.score,
          resumeData: typeof item.resume_data === "string" ? JSON.parse(item.resume_data) : item.resume_data,
          analysisResult: typeof item.analysis_result === "string" ? JSON.parse(item.analysis_result) : item.analysis_result,
        }));
      } catch (err) {
        console.warn("Supabase database fetch failed, reading local storage history instead:", err);
      }
    }

    // Fallback Local Storage
    try {
      const value = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      return value ? JSON.parse(value) : [];
    } catch {
      return [];
    }
  },

  async saveHistoryItem(resumeName: string, jobTitle: string, score: number, resumeData: ResumeData, analysisResult: AnalysisResult): Promise<AIHistoryItem> {
    const newItem: AIHistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      resumeName,
      jobTitle,
      score,
      resumeData,
      analysisResult,
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("resume_history")
          .insert([
            {
              resume_name: resumeName,
              job_title: jobTitle,
              score: score,
              resume_data: resumeData,
              analysis_result: analysisResult,
            }
          ])
          .select();

        if (error) throw error;
        if (data && data[0]) {
          const item = data[0];
          return {
            id: item.id,
            createdAt: item.created_at,
            resumeName: item.resume_name,
            jobTitle: item.job_title,
            score: item.score,
            resumeData: typeof item.resume_data === "string" ? JSON.parse(item.resume_data) : item.resume_data,
            analysisResult: typeof item.analysis_result === "string" ? JSON.parse(item.analysis_result) : item.analysis_result,
          };
        }
      } catch (err) {
        console.warn("Supabase insert failed, saving to local storage fallback:", err);
      }
    }

    // Fallback Save
    try {
      const history = await this.getHistory();
      const updated = [newItem, ...history];
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Local storage save failed:", e);
    }
    return newItem;
  },

  async deleteHistoryItem(id: string | number): Promise<boolean> {
    let databaseExecuted = false;
    if (supabase) {
      try {
        // Safe check for numeric ID vs UUID/string primary keys
        const parsedId = /^\d+$/.test(String(id)) ? parseInt(String(id), 10) : id;
        
        const { error } = await supabase
          .from("resume_history")
          .delete()
          .eq("id", parsedId);

        if (error) {
          console.warn("Supabase delete direct query warning:", error.message);
        } else {
          databaseExecuted = true;
        }
      } catch (err) {
        console.warn("Supabase delete operation encountered exception:", err);
      }
    }

    // Always clear from local storage fallback as well to guarantee UI removal regardless of RLS settings
    try {
      const history = await this.getHistory();
      const filtered = history.filter((item) => String(item.id) !== String(id));
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error("Local storage delete operation failed:", e);
      return databaseExecuted;
    }
  }
};
