import json, numpy as np, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
OUT="writeup/deck_charts/gold/"
S=json.load(open("/tmp/claude-0/-home-user-FederatedLearning/bdfc6d57-4d70-539a-9fe4-0082c22e60c6/scratchpad/stats2.json"))
INK="#051E39"; MUT="#526579"; GRID="#DDE3E8"; P1="#B39051"; P2="#051E39"; HON="#8A94A6"; GRAY="#8A94A6"
plt.rcParams.update({"font.family":"Inter","font.size":15,"text.color":INK,"axes.labelcolor":MUT,"xtick.color":MUT,"ytick.color":MUT,
  "axes.edgecolor":GRID,"axes.spines.top":False,"axes.spines.right":False,"axes.spines.left":False,"axes.grid":True,"axes.grid.axis":"y",
  "grid.color":GRID,"grid.linewidth":0.8,"axes.axisbelow":True,"legend.frameon":False,"savefig.dpi":200,"figure.facecolor":"white"})
ms=[0,2,4,10,20,30,40,50]; mlab=[str(m) for m in ms]
def save(fig,n): fig.savefig(OUT+n+".png",bbox_inches="tight",pad_inches=0.08); plt.close(fig)

# 1 baseline confusions
conf=[("‘A’ → ‘h’",1.6),("‘S’ → ‘5’",18.7),("‘1’ → ‘l’",30.3),("‘I’ → ‘1’",31.7),("‘0’ → ‘O’",65.4),("‘O’ → ‘0’",72.3),("‘l’ → ‘1’",109.3)]
fig,ax=plt.subplots(figsize=(7.4,4.9)); ax.grid(False)
cols=[P2,GRAY,GRAY,GRAY,GRAY,P1,GRAY]
y=np.arange(len(conf)); ax.barh(y,[c[1] for c in conf],color=cols,height=0.62)
for i,(l,v) in enumerate(conf): ax.text(v+1.5,i,f"{v:g}",va="center",fontsize=14,color=INK)
ax.set_yticks(y,[c[0] for c in conf],fontsize=15,fontfamily="JetBrains Mono"); ax.set_xticks([]); ax.spines["bottom"].set_visible(False)
ax.tick_params(axis="y",length=0); ax.set_xlim(0,122)
ax.set_title("Test images misclassified per run, clean model (mean of 10 runs)",fontsize=14,color=MUT,loc="left")
save(fig,"c1_confusions")

# 2/3 acc vs recall
def accrec(acc,rec,col,lab,n):
    fig,ax=plt.subplots(figsize=(7.6,4.95))
    ax.plot(mlab,acc,color=HON,lw=2.2,marker="o",ms=7,label="Global accuracy")
    ax.plot(mlab,rec,color=col,lw=2.2,marker="s",ms=7,label=lab)
    ax.set_ylim(0,100); ax.set_xlabel("Malicious participants (%)"); ax.set_ylabel("%")
    ax.text(7.1,acc[-1]+3,f"{acc[-1]:.1f}",color=INK,ha="center",fontsize=14); ax.text(7.1,rec[-1]-8,f"{rec[-1]:.1f}",color=INK,ha="center",fontsize=14)
    ax.text(0,acc[0]+(3 if rec[0]<acc[0] else -8),f"{acc[0]:.1f}",color=INK,ha="center",fontsize=14); ax.text(0,rec[0]+(3 if rec[0]>acc[0] else -8),f"{rec[0]:.1f}",color=INK,ha="center",fontsize=14)
    ax.legend(loc="lower left",fontsize=14); save(fig,n)
accrec([86.04,85.94,85.84,86.12,85.95,85.72,85.08,84.19],[75.15,77.37,75.36,68.78,67.78,57.97,32.33,7.19],P1,"‘O’ recall","c2_test1")
accrec([86.04,85.96,85.94,86.11,85.87,85.83,85.57,85.57],[92.47,91.32,89.95,89.50,82.65,74.89,48.86,30.82],P2,"‘A’ recall","c3_test2")

# 4 head to head loss
l1=[-2.2,-0.2,6.4,7.4,17.2,42.8,68.0]; l2=[1.1,2.5,3.0,9.8,17.6,43.6,61.6]
fig,ax=plt.subplots(figsize=(7.9,4.95)); x=np.arange(7); w=0.38
ax.bar(x-w/2-0.01,l1,w,color=P1,label="Test 1  ‘O’ → ‘0’"); ax.bar(x+w/2+0.01,l2,w,color=P2,label="Test 2  ‘A’ → ‘h’")
for i in range(7):
    ax.text(i-w/2,max(l1[i],0)+1.2,f"{l1[i]:.0f}",ha="center",fontsize=12); ax.text(i+w/2,max(l2[i],0)+1.2,f"{l2[i]:.0f}",ha="center",fontsize=12)
ax.axhline(0,color=MUT,lw=0.8); ax.set_xticks(x,[str(m) for m in ms[1:]]); ax.set_ylim(-10,80)
ax.set_xlabel("Malicious participants (%)"); ax.set_ylabel("Loss in source-class recall (pts)")
ax.axvspan(-0.5,2.5,color="#F4F6F8",zorder=0); ax.text(1,72,"within run-to-run noise",ha="center",fontsize=13,color=MUT)
ax.legend(loc="upper left",bbox_to_anchor=(0,0.88),fontsize=14); save(fig,"c4_head2head")

# 5 rounds small multiples
rounds=np.arange(1,201)
fig,axs=plt.subplots(1,2,figsize=(11.6,4.6),sharey=True)
for ax,(k,base,lab,ramp) in zip(axs,[("24_0",P1,"‘O’ recall (%)",["#E6D5B0","#CDAF73",P1]),("10_43",P2,"‘A’ recall (%)",["#9DB0C6","#4C6A8C",P2])]):
    C=S[k]["curves"]
    def sm(v): v=np.array(v); return np.convolve(v,np.ones(5)/5,mode="valid")
    rr=rounds[2:-2]
    ax.plot(rr,sm(C["0"]),color=GRAY,lw=2,label="No attack")
    for m,c in zip(["10","30","50"],ramp): ax.plot(rr,sm(C[m]),color=c,lw=2,label=f"{m}% malicious")
    ax.set_ylim(0,100); ax.set_xlabel("Round"); ax.set_title(("Test 1  ‘O’ → ‘0’" if k=="24_0" else "Test 2  ‘A’ → ‘h’"),loc="left",fontsize=16,color=INK)
    ax.legend(loc="upper center",bbox_to_anchor=(0.5,-0.2),fontsize=13,ncol=2,handlelength=1.4,columnspacing=1.2)
axs[0].set_ylabel("Source-class recall (%)")
save(fig,"c5_rounds")

# 6 where source images go (share %)
fig,axs=plt.subplots(1,2,figsize=(11.6,4.6),sharey=True)
for ax,(k,tc,tl,sl,tot) in zip(axs,[("24_0",P1,"labeled ‘0’","‘O’",299),("10_43",P2,"labeled ‘h’","‘A’",73)]):
    D=S[k]["dist"]; base=S["base_dist"][k]
    rows=[base]+[D[str(m)] for m in ms[1:]]
    a=np.array(rows)/tot*100
    ax.bar(mlab,a[:,0],color="#DCE3E9",label="correct",width=0.7,edgecolor="white",linewidth=1.5)
    ax.bar(mlab,a[:,1],bottom=a[:,0],color=tc,label=tl,width=0.7,edgecolor="white",linewidth=1.5)
    ax.bar(mlab,a[:,2],bottom=a[:,0]+a[:,1],color="#687787",label="other classes",width=0.7,edgecolor="white",linewidth=1.5)
    for i in [0,7]:
        ax.text(i,a[i,0]/2,f"{a[i,0]:.0f}%",ha="center",va="center",fontsize=12,color=INK)
        if a[i,1]>6: ax.text(i,a[i,0]+a[i,1]/2,f"{a[i,1]:.0f}%",ha="center",va="center",fontsize=12,color="white")
    ax.set_ylim(0,100); ax.grid(False); ax.set_xlabel("Malicious participants (%)")
    ax.set_title(f"Where the {tot} {sl} test images go",loc="left",fontsize=16)
    ax.legend(loc="upper center",bbox_to_anchor=(0.5,-0.2),ncol=3,fontsize=13)
axs[0].set_ylabel("Share of source test images (%)")
save(fig,"c6_where")

# 7 accuracy drop vs share*loss
fig,ax=plt.subplots(figsize=(7.4,4.9))
for k,col,lab,share,loss,acc in [("24_0",P1,"Test 1  ‘O’ (3.6% of test set)",3.58,l1,[85.94,85.84,86.12,85.95,85.72,85.08,84.19]),
                                  ("10_43",P2,"Test 2  ‘A’ (0.9% of test set)",0.88,l2,[85.96,85.94,86.11,85.87,85.83,85.57,85.57])]:
    drop=[86.04-a for a in acc]
    ax.scatter(loss,drop,color=col,s=55,zorder=3,label=lab,edgecolor="white",linewidth=1.2)
    xx=np.array([0,75]); ax.plot(xx,xx*share/100,color=col,lw=1.4,ls="--",zorder=2)
ax.text(70,2.35,"recall loss × class share",color=MUT,fontsize=12,ha="right")
ax.axhspan(-0.4,0.27,color="#F4F6F8",zorder=0); ax.text(72,-0.3,"baseline accuracy noise (±3σ)",fontsize=12,color=MUT,ha="right")
ax.set_xlim(-5,75); ax.set_ylim(-0.4,2.7); ax.set_xlabel("Loss in source-class recall (pts)"); ax.set_ylabel("Drop in global accuracy (pts)")
ax.legend(loc="upper left",fontsize=13); save(fig,"c7_accshare")

# 8 other-class noise scatter (m=30)
import glob,csv
def fin(base,m): return np.mean([np.array(list(map(float,list(csv.reader(open(f)))[-1])))[64:126]*100 for f in sorted(glob.glob(f"/home/user/FederatedLearning/{base}/m{m}/*_results.csv"))],0)
b=fin("results/label_flipping/0_to_0",0); d1=fin("results/label_flipping/24_to_0",30)-b; d2=fin("results/label_flipping/10_to_43",30)-b
oth=[c for c in range(62) if c not in (24,0,10,43)]
fig,ax=plt.subplots(figsize=(6.6,4.9)); ax.grid(True,axis="both")
ax.plot([-12,14],[-12,14],color=GRAY,lw=1,ls="--"); ax.scatter(d1[oth],d2[oth],s=42,color="#526579",edgecolor="white",linewidth=1,zorder=3)
ax.set_xlim(-12,14); ax.set_ylim(-12,14); ax.set_aspect("equal")
ax.set_xlabel("Change under test 1 (pts)"); ax.set_ylabel("Change under test 2 (pts)")
ax.text(-11,11.5,f"r = {np.corrcoef(d1[oth],d2[oth])[0,1]:.2f}",fontsize=15,color=INK)
ax.set_title("Recall change of the 58 uninvolved classes, 30% malicious",loc="left",fontsize=13,color=MUT)
save(fig,"c8_noise")

# 9 last-round attacker
fig,ax=plt.subplots(figsize=(6.6,4.9)); x=np.arange(2); w=0.36
yes=[62.2,81.3]; no=[70.2,84.5]
ax.bar(x-w/2-0.01,no,w,color="#DCE3E9")
ax.bar(x+w/2+0.01,yes,w,color=[P1,P2])
for i in range(2):
    ax.text(i-w/2,no[i]+1.5,f"{no[i]:.1f}",ha="center",fontsize=13); ax.text(i+w/2,yes[i]+1.5,f"{yes[i]:.1f}",ha="center",fontsize=13)
ax.set_xticks([x[0]-w/2,x[0]+w/2,x[1]-w/2,x[1]+w/2],["no attacker","attacker","no attacker","attacker"],fontsize=13)
ax.tick_params(axis="x",length=0)
for i,t in enumerate(["Test 1  ‘O’ recall","Test 2  ‘A’ recall"]): ax.text(i,-17,t,ha="center",fontsize=15,color=INK)
ax.set_ylim(0,100); ax.set_ylabel("Final source recall (%)")
ax.set_title("Runs at 10–30% malicious, by who trained in round 200 (3 vs 6 runs)",loc="left",fontsize=13,color=MUT)
save(fig,"c9_lastround")
print("ok")
