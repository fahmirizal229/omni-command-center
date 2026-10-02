import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Database,
  Table as TableIcon,
  Search,
  RefreshCw,
  Download,
  Code2,
  FileSpreadsheet,
  Layers,
  Key,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Play,
  Copy,
  Check,
  Maximize2,
  X,
  AlertCircle,
  HardDrive,
  Swords,
  Feather,
  Wallet,
  HeartPulse,
  Brain,
  Radar,
  Network,
  Briefcase,
  CloudSun,
  Activity,
  Workflow,
  MessageSquare,
  CheckSquare,
  UserCheck,
  Columns,
  Grid,
  List,
  SlidersHorizontal,
  Info,
  Bot,
  Globe,
} from "lucide-react";
import { api } from "../api";

// Icon mapper for databases
const ICON_MAP = {
  Swords,
  Feather,
  Wallet,
  HeartPulse,
  Sparkles,
  CheckSquare,
  UserCheck,
  Brain,
  Radar,
  Network,
  Briefcase,
  CloudSun,
  Activity,
  Workflow,
  MessageSquare,
  Bot,
  Globe,
};

export function DatabaseView({ isDark = true }) {
  // State
  const [databases, setDatabases] = useState([]);
  const [selectedDbId, setSelectedDbId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [dbSearch, setDbSearch] = useState("");
  const [loadingDbs, setLoadingDbs] = useState(true);

  // Table Explorer State
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loadingTables, setLoadingTables] = useState(false);
  const [tableSearch, setTableSearch] = useState("");

  // Sub Tab: data, schema, sql
  const [activeTab, setActiveTab] = useState("data");

  // Data Grid State
  const [tableData, setTableData] = useState({
    columns: [],
    rows: [],
    total_rows: 0,
    page: 1,
    limit: 50,
    total_pages: 1,
    latency_ms: 0,
  });
  const [loadingData, setLoadingData] = useState(false);
  const [dataSearch, setDataSearch] = useState("");
  const [debouncedDataSearch, setDebouncedDataSearch] = useState("");
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [viewMode, setViewMode] = useState("table"); // table | cards

  // Schema State
  const [schemaInfo, setSchemaInfo] = useState(null);
  const [loadingSchema, setLoadingSchema] = useState(false);

  // SQL Console State
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM kuro_tasks LIMIT 20;");
  const [queryResult, setQueryResult] = useState(null);
  const [runningQuery, setRunningQuery] = useState(false);

  // Cell Inspector Modal
  const [inspectCell, setInspectCell] = useState(null);
  const [copiedCell, setCopiedCell] = useState(false);

  // Mobile Drawer Toggle
  const [mobileTableDrawer, setMobileTableDrawer] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDataSearch(dataSearch), 350);
    return () => clearTimeout(timer);
  }, [dataSearch]);

  // Load Database List
  const fetchDatabases = useCallback(async () => {
    setLoadingDbs(true);
    try {
      const res = await api.getDatabaseList();
      const list = res.databases || [];
      setDatabases(list);
      if (list.length > 0 && !selectedDbId) {
        setSelectedDbId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to load databases:", err);
    } finally {
      setLoadingDbs(false);
    }
  }, [selectedDbId]);

  useEffect(() => {
    fetchDatabases();
  }, [fetchDatabases]);

  // Selected Database Info
  const currentDb = useMemo(() => {
    return databases.find((d) => d.id === selectedDbId) || null;
  }, [databases, selectedDbId]);

  // Categories
  const categories = useMemo(() => {
    const cats = new Set(databases.map((d) => d.category));
    return ["ALL", ...Array.from(cats)];
  }, [databases]);

  // Filtered Databases
  const filteredDatabases = useMemo(() => {
    return databases.filter((db) => {
      const matchCat = activeCategory === "ALL" || db.category === activeCategory;
      const matchSearch =
        !dbSearch ||
        db.name.toLowerCase().includes(dbSearch.toLowerCase()) ||
        db.description.toLowerCase().includes(dbSearch.toLowerCase()) ||
        db.path.toLowerCase().includes(dbSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [databases, activeCategory, dbSearch]);

  // Fetch Tables when DB changes
  useEffect(() => {
    if (!selectedDbId) return;
    let isMounted = true;
    setLoadingTables(true);
    setSelectedTable(null);
    setTableData({ columns: [], rows: [], total_rows: 0, page: 1, limit: 50, total_pages: 1, latency_ms: 0 });
    setSchemaInfo(null);
    setQueryResult(null);

    api.getDatabaseTables(selectedDbId)
      .then((res) => {
        if (!isMounted) return;
        const tbls = res.tables || [];
        setTables(tbls);
        if (tbls.length > 0) {
          setSelectedTable(tbls[0].name);
          setSqlQuery(`SELECT * FROM \`${tbls[0].name}\` LIMIT 25;`);
        }
      })
      .catch((err) => {
        console.error("Failed to load tables:", err);
        if (isMounted) setTables([]);
      })
      .finally(() => {
        if (isMounted) setLoadingTables(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDbId]);

  // Fetch Table Data
  const fetchTableData = useCallback(async () => {
    if (!selectedDbId || !selectedTable || activeTab !== "data") return;
    setLoadingData(true);
    try {
      const res = await api.getTableData(selectedDbId, selectedTable, {
        page,
        limit,
        search: debouncedDataSearch,
        sort_col: sortCol || undefined,
        sort_dir: sortDir,
      });
      setTableData(res);
    } catch (err) {
      console.error("Failed to load table data:", err);
    } finally {
      setLoadingData(false);
    }
  }, [selectedDbId, selectedTable, activeTab, page, limit, debouncedDataSearch, sortCol, sortDir]);

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  // Fetch Schema Info
  useEffect(() => {
    if (!selectedDbId || !selectedTable || activeTab !== "schema") return;
    setLoadingSchema(true);
    api.getTableSchema(selectedDbId, selectedTable)
      .then((res) => setSchemaInfo(res))
      .catch((err) => console.error("Failed to load schema:", err))
      .finally(() => setLoadingSchema(false));
  }, [selectedDbId, selectedTable, activeTab]);

  // Execute Custom SQL Query
  const handleExecuteQuery = async () => {
    if (!selectedDbId || !sqlQuery.trim()) return;
    setRunningQuery(true);
    setQueryResult(null);
    try {
      const res = await api.executeDatabaseQuery(selectedDbId, sqlQuery.trim());
      setQueryResult(res);
    } catch (err) {
      setQueryResult({
        success: false,
        error: err.message || "Query execution failed",
        columns: [],
        rows: [],
        latency_ms: 0,
      });
    } finally {
      setRunningQuery(false);
    }
  };

  // Sort toggle
  const handleSort = (columnName) => {
    if (sortCol === columnName) {
      if (sortDir === "asc") setSortDir("desc");
      else {
        setSortCol(null);
        setSortDir("asc");
      }
    } else {
      setSortCol(columnName);
      setSortDir("asc");
    }
    setPage(1);
  };

  // Copy Cell
  const handleCopy = (text) => {
    navigator.clipboard.writeText(typeof text === "object" ? JSON.stringify(text, null, 2) : String(text));
    setCopiedCell(true);
    setTimeout(() => setCopiedCell(false), 2000);
  };

  // Cell format renderer
  const renderCellContent = (val) => {
    if (val === null || val === undefined) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-500/10 text-slate-400 italic">
          NULL
        </span>
      );
    }
    if (typeof val === "boolean" || val === 1 && (val === true || val === false)) {
      return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${val ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
          {val ? "TRUE" : "FALSE"}
        </span>
      );
    }
    const str = String(val);
    if (str.startsWith("{") || str.startsWith("[")) {
      try {
        JSON.parse(str);
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 max-w-[200px] truncate">
            <Code2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{str}</span>
          </span>
        );
      } catch {}
    }
    return <span className="font-mono text-xs truncate max-w-[280px] block">{str}</span>;
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn pb-12">
      {/* 1. Hero Header & Global Summary */}
      <div
        className={`p-6 rounded-3xl border relative overflow-hidden transition-all duration-300 ${
          isDark
            ? "bg-gradient-to-br from-[#0f1422]/90 via-[#0a0d16]/95 to-[#08090d] border-indigo-500/20 shadow-2xl shadow-indigo-950/30"
            : "bg-white border-slate-200 shadow-xl shadow-slate-200/50"
        }`}
      >
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-2 ring-white/10">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
                    SQLite Web Studio
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Pro GUI
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Direct live browser engine across all Kuro Squad, Hermes, Life & System SQLite databases
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div
              className={`p-3 rounded-2xl border text-center transition-all ${
                isDark ? "bg-[#121829]/70 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active DBs</div>
              <div className="text-lg font-bold font-mono text-indigo-400">{databases.length}</div>
            </div>
            <div
              className={`p-3 rounded-2xl border text-center transition-all ${
                isDark ? "bg-[#121829]/70 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Current Tables</div>
              <div className="text-lg font-bold font-mono text-cyan-400">{tables.length}</div>
            </div>
            <div
              className={`p-3 rounded-2xl border text-center transition-all ${
                isDark ? "bg-[#121829]/70 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Storage Size</div>
              <div className="text-lg font-bold font-mono text-emerald-400">{currentDb?.size_formatted || "0 KB"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Database Selection Carousel / Grid */}
      <div className="space-y-3">
        {/* Category Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50"
                    : isDark
                    ? "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search database..."
              value={dbSearch}
              onChange={(e) => setDbSearch(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs transition-all outline-none ${
                isDark
                  ? "bg-slate-900/80 border border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500"
                  : "bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500"
              }`}
            />
          </div>
        </div>

        {/* Database Cards Horizontal Scroll */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredDatabases.map((db) => {
            const isSelected = selectedDbId === db.id;
            const IconComp = ICON_MAP[db.icon] || Database;
            return (
              <button
                key={db.id}
                onClick={() => setSelectedDbId(db.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 relative group flex flex-col justify-between ${
                  isSelected
                    ? isDark
                      ? "bg-gradient-to-br from-indigo-950/60 via-[#101526] to-[#0d101c] border-indigo-500/60 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500/40"
                      : "bg-indigo-50/80 border-indigo-400 shadow-md shadow-indigo-100 ring-1 ring-indigo-400/30"
                    : isDark
                    ? "bg-[#0b0e17]/80 hover:bg-[#101422] border-slate-800/80 hover:border-slate-700 text-slate-300"
                    : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : isDark
                          ? "bg-slate-800 text-slate-400 group-hover:text-indigo-400"
                          : "bg-slate-100 text-slate-500 group-hover:text-indigo-600"
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                      {db.size_formatted}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold truncate">{db.name}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{db.description}</p>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-500 w-full font-mono">
                  <span>{db.table_count} Tables</span>
                  <span className="truncate max-w-[120px]" title={db.path}>
                    {db.path.split("/").pop()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Workspace: Table Drawer + Tab Bar + Grid */}
      <div
        className={`rounded-3xl border overflow-hidden flex flex-col transition-all duration-300 ${
          isDark ? "bg-[#0b0e17] border-slate-800/80 shadow-2xl" : "bg-white border-slate-200 shadow-xl"
        }`}
      >
        {/* Workspace Sub-Header & Mode Navigation */}
        <div
          className={`p-4 border-b flex flex-wrap items-center justify-between gap-4 ${
            isDark ? "bg-[#0e121e]/90 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}
        >
          {/* Active Database & Table Badge */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileTableDrawer(!mobileTableDrawer)}
              className="lg:hidden p-2 rounded-xl bg-indigo-600 text-white flex items-center gap-1.5 text-xs font-bold"
            >
              <TableIcon className="w-4 h-4" />
              <span>Tables</span>
            </button>
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-indigo-400 font-bold">{currentDb?.name || "Select DB"}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                {selectedTable ? `\`${selectedTable}\`` : "No Table Selected"}
              </span>
            </div>
          </div>

          {/* Tab Navigation: Data | Schema | SQL Console */}
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab("data")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "data"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Data Explorer</span>
            </button>
            <button
              onClick={() => setActiveTab("schema")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "schema"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Schema Structure</span>
            </button>
            <button
              onClick={() => setActiveTab("sql")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "sql"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>SQL Playground</span>
            </button>
          </div>
        </div>

        {/* Workspace Body: Split View (Tables Sidebar + Explorer Content) */}
        <div className="flex flex-1 min-h-[550px] relative">
          {/* Tables Sidebar (Desktop + Mobile Drawer) */}
          <div
            className={`w-64 border-r flex flex-col shrink-0 transition-all duration-300 lg:static absolute inset-y-0 left-0 z-20 ${
              mobileTableDrawer ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            } ${
              isDark
                ? "bg-[#090c14] border-slate-800/80"
                : "bg-slate-50/95 border-slate-200 backdrop-blur-md"
            }`}
          >
            {/* Table Search */}
            <div className="p-3 border-b border-slate-800/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter tables..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className={`w-full pl-8 pr-2 py-1.5 rounded-xl text-xs outline-none transition-all ${
                    isDark
                      ? "bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500"
                      : "bg-white border border-slate-200 text-slate-800 placeholder-slate-400"
                  }`}
                />
              </div>
            </div>

            {/* Table Items List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              {loadingTables ? (
                <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Loading tables...</span>
                </div>
              ) : tables.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">No tables found</div>
              ) : (
                tables
                  .filter((t) => !tableSearch || t.name.toLowerCase().includes(tableSearch.toLowerCase()))
                  .map((t) => {
                    const isSelected = selectedTable === t.name;
                    return (
                      <button
                        key={t.name}
                        onClick={() => {
                          setSelectedTable(t.name);
                          setPage(1);
                          setMobileTableDrawer(false);
                          setSqlQuery(`SELECT * FROM \`${t.name}\` LIMIT 25;`);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-left text-xs font-mono flex items-center justify-between transition-all group ${
                          isSelected
                            ? "bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/30"
                            : isDark
                            ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <TableIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          <span className="truncate">{t.name}</span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-md shrink-0 font-medium ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-500/10 text-slate-500 group-hover:text-slate-300"
                          }`}
                        >
                          {t.row_count}
                        </span>
                      </button>
                    );
                  })
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent">
            {/* === TAB 1: DATA EXPLORER === */}
            {activeTab === "data" && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Data Toolbar */}
                <div
                  className={`p-3 border-b flex flex-wrap items-center justify-between gap-3 ${
                    isDark ? "bg-[#0b0e17]/60 border-slate-800" : "bg-slate-50/60 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
                    <div className="relative w-full">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder={`Search in ${selectedTable || "table"}...`}
                        value={dataSearch}
                        onChange={(e) => {
                          setDataSearch(e.target.value);
                          setPage(1);
                        }}
                        className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none ${
                          isDark
                            ? "bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500"
                            : "bg-white border border-slate-200 text-slate-800 placeholder-slate-400"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Mode Toggle (Table / Card) */}
                    <div className="flex items-center bg-slate-900/60 p-0.5 rounded-xl border border-slate-800">
                      <button
                        onClick={() => setViewMode("table")}
                        className={`p-1.5 rounded-lg transition-all ${
                          viewMode === "table" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="Table Grid"
                      >
                        <TableIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewMode("cards")}
                        className={`p-1.5 rounded-lg transition-all ${
                          viewMode === "cards" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="Mobile Card View"
                      >
                        <Grid className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Refresh Button */}
                    <button
                      onClick={fetchTableData}
                      disabled={loadingData}
                      className="p-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-slate-700 transition-all"
                      title="Refresh Data"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? "animate-spin text-indigo-400" : ""}`} />
                    </button>

                    {/* Export Dropdown / Actions */}
                    {selectedDbId && selectedTable && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={api.getDatabaseExportUrl(selectedDbId, selectedTable, "csv")}
                          download
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1.5 transition-all"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">CSV</span>
                        </a>
                        <a
                          href={api.getDatabaseExportUrl(selectedDbId, selectedTable, "json")}
                          download
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 flex items-center gap-1.5 transition-all"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">JSON</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Table Grid / Card Canvas */}
                <div className="flex-1 overflow-auto p-4 min-h-[350px]">
                  {loadingData ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                      <span>Fetching live table rows...</span>
                    </div>
                  ) : !selectedTable ? (
                    <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
                      Select a table from the sidebar to inspect records
                    </div>
                  ) : tableData.rows.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                      <Info className="w-6 h-6 text-slate-600" />
                      <span>No records found in `{selectedTable}`</span>
                    </div>
                  ) : viewMode === "table" ? (
                    <div className="overflow-x-auto rounded-2xl border border-slate-800">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className={isDark ? "bg-[#111624] text-slate-300" : "bg-slate-100 text-slate-700"}>
                            <th className="p-3 text-[11px] font-bold font-mono uppercase tracking-wider border-b border-slate-800 w-12 text-center text-slate-500">
                              #
                            </th>
                            {tableData.columns.map((col) => {
                              const isSorted = sortCol === col;
                              return (
                                <th
                                  key={col}
                                  onClick={() => handleSort(col)}
                                  className="p-3 text-[11px] font-bold font-mono uppercase tracking-wider border-b border-slate-800 cursor-pointer select-none hover:bg-slate-800/40 transition-colors whitespace-nowrap"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span>{col}</span>
                                    {isSorted ? (
                                      sortDir === "asc" ? (
                                        <ArrowUp className="w-3 h-3 text-indigo-400" />
                                      ) : (
                                        <ArrowDown className="w-3 h-3 text-indigo-400" />
                                      )
                                    ) : (
                                      <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-50" />
                                    )}
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {tableData.rows.map((row, idx) => (
                            <tr
                              key={idx}
                              className={`transition-all duration-150 relative group ${
                                isDark
                                  ? "hover:bg-indigo-600/[0.08] hover:shadow-xs"
                                  : "hover:bg-indigo-50/70"
                              }`}
                            >
                              <td className="p-3 text-[11px] font-mono text-center text-slate-500 relative">
                                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                {(page - 1) * limit + idx + 1}
                              </td>
                              {tableData.columns.map((col) => (
                                <td
                                  key={col}
                                  onClick={() => setInspectCell({ col, value: row[col] })}
                                  className="p-3 cursor-pointer transition-colors group-hover:text-slate-100"
                                  title="Click to inspect cell"
                                >
                                  {renderCellContent(row[col])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* Mobile Card View */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {tableData.rows.map((row, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
                            isDark
                              ? "bg-[#0e121e] border-slate-800/80 hover:border-indigo-500/40"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800/50 text-xs font-mono text-slate-400">
                            <span className="font-bold text-indigo-400">Record #{ (page - 1) * limit + idx + 1 }</span>
                            <button
                              onClick={() => setInspectCell({ col: "Entire Row", value: row })}
                              className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
                            >
                              Inspect JSON
                            </button>
                          </div>
                          <div className="space-y-1.5 text-xs">
                            {tableData.columns.map((col) => (
                              <div key={col} className="flex items-start justify-between gap-2">
                                <span className="text-[11px] font-mono text-slate-400 shrink-0 font-medium">
                                  {col}:
                                </span>
                                <div
                                  onClick={() => setInspectCell({ col, value: row[col] })}
                                  className="cursor-pointer text-right"
                                >
                                  {renderCellContent(row[col])}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagination Footer */}
                <div
                  className={`p-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
                    isDark ? "bg-[#0b0e17] border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span>
                      Total: <strong className="text-slate-200">{tableData.total_rows}</strong> records
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-emerald-400">{tableData.latency_ms} ms</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px]">
                      Page {tableData.page} of {tableData.total_pages}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage(1)}
                        disabled={page <= 1}
                        className="p-1 rounded-lg border border-slate-800 disabled:opacity-30 hover:bg-slate-800"
                      >
                        <ChevronsLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="p-1 rounded-lg border border-slate-800 disabled:opacity-30 hover:bg-slate-800"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(tableData.total_pages, p + 1))}
                        disabled={page >= tableData.total_pages}
                        className="p-1 rounded-lg border border-slate-800 disabled:opacity-30 hover:bg-slate-800"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPage(tableData.total_pages)}
                        disabled={page >= tableData.total_pages}
                        className="p-1 rounded-lg border border-slate-800 disabled:opacity-30 hover:bg-slate-800"
                      >
                        <ChevronsRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* === TAB 2: SCHEMA STRUCTURE === */}
            {activeTab === "schema" && (
              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {loadingSchema ? (
                  <div className="h-64 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Loading schema...</span>
                  </div>
                ) : !schemaInfo ? (
                  <div className="text-xs text-slate-500">Select a table to view schema specifications</div>
                ) : (
                  <div className="space-y-6">
                    {/* Columns Specification Table */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <Columns className="w-4 h-4 text-indigo-400" />
                          <span>Columns Definition</span>
                        </h3>
                        <span className="text-xs font-mono text-slate-400">{schemaInfo.columns.length} Columns</span>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-slate-800">
                        <table className="w-full text-left font-mono text-xs">
                          <thead>
                            <tr className={isDark ? "bg-[#111624] text-slate-300" : "bg-slate-100 text-slate-700"}>
                              <th className="p-3 border-b border-slate-800">CID</th>
                              <th className="p-3 border-b border-slate-800">Column Name</th>
                              <th className="p-3 border-b border-slate-800">Data Type</th>
                              <th className="p-3 border-b border-slate-800">Nullability</th>
                              <th className="p-3 border-b border-slate-800">Default Value</th>
                              <th className="p-3 border-b border-slate-800">Primary Key</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {schemaInfo.columns.map((c) => (
                              <tr key={c.cid} className={isDark ? "hover:bg-[#131929]/50" : "hover:bg-slate-50"}>
                                <td className="p-3 text-slate-500">{c.cid}</td>
                                <td className="p-3 font-bold text-slate-200">{c.name}</td>
                                <td className="p-3 text-cyan-400 font-bold">{c.type || "BLOB/TEXT"}</td>
                                <td className="p-3">
                                  {c.notnull ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      NOT NULL
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">NULLABLE</span>
                                  )}
                                </td>
                                <td className="p-3 text-slate-400">{c.dflt_value || "—"}</td>
                                <td className="p-3">
                                  {c.pk > 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                      <Key className="w-3 h-3" />
                                      <span>PK (#{c.pk})</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-600">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Indexes & Foreign Keys */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? "bg-[#0e121e] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                        <h4 className="text-xs font-bold font-mono text-slate-300 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Indexes ({schemaInfo.indexes?.length || 0})</span>
                        </h4>
                        {schemaInfo.indexes?.length === 0 ? (
                          <p className="text-[11px] text-slate-500">No secondary indexes defined</p>
                        ) : (
                          <div className="space-y-1.5">
                            {schemaInfo.indexes.map((idx, i) => (
                              <div key={i} className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs font-mono flex items-center justify-between">
                                <span className="font-bold text-slate-300">{idx.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                  {idx.unique ? "UNIQUE" : "INDEX"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? "bg-[#0e121e] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                        <h4 className="text-xs font-bold font-mono text-slate-300 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                          <span>Foreign Keys ({schemaInfo.foreign_keys?.length || 0})</span>
                        </h4>
                        {schemaInfo.foreign_keys?.length === 0 ? (
                          <p className="text-[11px] text-slate-500">No foreign key constraints</p>
                        ) : (
                          <div className="space-y-1.5">
                            {schemaInfo.foreign_keys.map((fk, i) => (
                              <div key={i} className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs font-mono">
                                <span className="text-slate-400">{fk.from}</span> ➔ <span className="font-bold text-indigo-400">{fk.table}({fk.to})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* === TAB 3: SQL PLAYGROUND === */}
            {activeTab === "sql" && (
              <div className="flex-1 p-4 md:p-6 space-y-4 flex flex-col min-h-0 overflow-y-auto">
                {/* SQL Editor Box */}
                <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? "bg-[#0e121e] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold font-mono">SQL Query Playground</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        onClick={() => setSqlQuery(`SELECT * FROM \`${selectedTable || "tasks"}\` LIMIT 20;`)}
                        className="px-2 py-1 rounded-lg text-[11px] font-mono bg-slate-800 text-slate-300 hover:bg-slate-700"
                      >
                        SELECT *
                      </button>
                      <button
                        onClick={() => setSqlQuery(`SELECT COUNT(*) as total_count FROM \`${selectedTable || "tasks"}\`;`)}
                        className="px-2 py-1 rounded-lg text-[11px] font-mono bg-slate-800 text-slate-300 hover:bg-slate-700"
                      >
                        COUNT
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                        handleExecuteQuery();
                      }
                    }}
                    placeholder="Enter your SQL query here... (Press Ctrl+Enter to Run)"
                    className={`w-full p-3 rounded-xl font-mono text-xs outline-none transition-all resize-y ${
                      isDark
                        ? "bg-[#080b12] border border-slate-800 text-slate-200 focus:border-indigo-500"
                        : "bg-white border border-slate-300 text-slate-900 focus:border-indigo-500"
                    }`}
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                      Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">Ctrl + Enter</kbd> to execute
                    </span>
                    <button
                      onClick={handleExecuteQuery}
                      disabled={runningQuery || !sqlQuery.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-50"
                    >
                      <Play className={`w-3.5 h-3.5 fill-current ${runningQuery ? "animate-spin" : ""}`} />
                      <span>{runningQuery ? "Executing..." : "Run SQL Query"}</span>
                    </button>
                  </div>
                </div>

                {/* Query Result Section */}
                {queryResult && (
                  <div className="space-y-3 flex-1 flex flex-col min-h-0 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${queryResult.success ? "text-emerald-400" : "text-rose-400"}`}>
                          {queryResult.success ? "✓ Query Executed Successfully" : "✗ Query Failed"}
                        </span>
                        <span className="text-slate-500">({queryResult.latency_ms} ms)</span>
                      </div>
                      <span className="text-slate-400">{queryResult.affected_rows} rows affected / returned</span>
                    </div>

                    {!queryResult.success ? (
                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                        {queryResult.error}
                      </div>
                    ) : queryResult.rows.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500 font-mono rounded-2xl border border-slate-800">
                        Query executed with no returned rows.
                      </div>
                    ) : (
                      <div className="overflow-auto rounded-2xl border border-slate-800 max-h-[350px]">
                        <table className="w-full text-left font-mono text-xs border-collapse">
                          <thead>
                            <tr className={isDark ? "bg-[#111624] text-slate-300" : "bg-slate-100 text-slate-700"}>
                              {queryResult.columns.map((col) => (
                                <th key={col} className="p-2.5 border-b border-slate-800 uppercase tracking-wider font-bold">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {queryResult.rows.map((row, idx) => (
                              <tr key={idx} className={isDark ? "hover:bg-indigo-500/[0.08] transition-colors" : "hover:bg-slate-50"}>
                                {queryResult.columns.map((col) => (
                                  <td
                                    key={col}
                                    onClick={() => setInspectCell({ col, value: row[col] })}
                                    className="p-2.5 cursor-pointer max-w-[250px] truncate"
                                    title="Click to inspect"
                                  >
                                    {renderCellContent(row[col])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Cell Detail Inspector Modal */}
      {inspectCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn" onClick={() => setInspectCell(null)}>
          <div
            className={`w-full max-w-2xl max-h-[85vh] rounded-3xl border flex flex-col shadow-2xl overflow-hidden animate-scaleUp ${
              isDark ? "bg-[#0e121e] border-indigo-500/30 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.8)]" : "bg-white border-slate-300 text-slate-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold font-mono">Cell Inspector: {inspectCell.col}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(inspectCell.value)}
                  className="px-2.5 py-1 rounded-xl text-xs font-mono font-semibold bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 active:scale-95 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedCell ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCell ? "Copied!" : "Copy Value"}</span>
                </button>
                <button
                  onClick={() => setInspectCell(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs">
              <pre className="p-4 rounded-2xl bg-[#080b12] border border-slate-800 text-slate-200 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                {typeof inspectCell.value === "object"
                  ? JSON.stringify(inspectCell.value, null, 2)
                  : String(inspectCell.value)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

