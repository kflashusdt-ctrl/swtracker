export default function TransferParties() {
    return (
      <div className="mt-6 grid gap-4 rounded-2xl bg-paper p-5 sm:grid-cols-[1fr_auto_1fr] sm:items-start sm:p-6 border border-line">
        
        {/* Sender */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-sub mb-2">Sender</h3>
          <p className="font-semibold text-ink">S S V Viswanatham</p>
          <p className="text-sm font-medium text-ink-2 mt-1">United Overseas Bank</p>
          <p className="text-xs text-sub mt-0.5">UOVBSGSG</p>
          <p className="text-xs text-sub mt-2 leading-relaxed">
            Bukit Batok Central Branch, Blk 634 Bukit Batok Central, #01-104/106, Singapore 650634
          </p>
          <p className="text-xs font-mono text-sub mt-2">Acct: 9104353487</p>
          <p className="text-[11px] text-sub mt-1">Signatory: Sripada Srivallabha Venkata Viswanatham</p>
          <p className="text-[11px] text-sub mt-1">Officer: Mr Andrew Wei Lun (Relationship Manager)</p>
        </div>
  
        <div className="hidden sm:flex items-center justify-center text-line px-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </div>
  
        {/* Receiver */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-sub mb-2">Recipient</h3>
          <p className="font-semibold text-ink">Lorato Tlhabano</p>
          <p className="text-sm font-medium text-ink-2 mt-1">Access Bank Botswana</p>
          <p className="text-xs text-sub mt-0.5">FMBZBWGAXXX</p>
          <p className="text-xs text-sub mt-2 leading-relaxed">
            Airport Junction branch (550567), Gaborone, Botswana
          </p>
          <p className="text-xs font-mono text-sub mt-2">Acct: 1174641610701</p>
        </div>
  
      </div>
    );
  }