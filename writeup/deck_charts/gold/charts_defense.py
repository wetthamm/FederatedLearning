"""Defense charts (d1 PCA scatter, d2 participant averages, d3 detection summary).
Run from the repo root after defense_eval.py: python3 writeup/deck_charts/charts_defense.py"""
import json, numpy as np, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
OUT="writeup/deck_charts/gold/"
INK="#051E39"; MUT="#526579"; GRID="#DDE3E8"; P1="#B39051"; P2="#051E39"; GRAY="#8A94A6"
plt.rcParams.update({"font.family":"Inter","font.size":15,"text.color":INK,"axes.labelcolor":MUT,"xtick.color":MUT,"ytick.color":MUT,
  "axes.edgecolor":GRID,"axes.spines.top":False,"axes.spines.right":False,"axes.spines.left":False,"axes.grid":True,"axes.grid.axis":"y",
  "grid.color":GRID,"grid.linewidth":0.8,"axes.axisbelow":True,"legend.frameon":False,"savefig.dpi":200,"figure.facecolor":"white"})
def save(fig,n): fig.savefig(OUT+n+".png",bbox_inches="tight",pad_inches=0.08); plt.close(fig)
PAIRS=[("24_to_0","Test 1  ‘O’ → ‘0’",P1),("10_to_43","Test 2  ‘A’ → ‘h’",P2)]
PTS={p:json.load(open(f"analysis/defense_points_{p}.json")) for p,_,_ in PAIRS}
RES={p:json.load(open(f"analysis/defense_{p}.json")) for p,_,_ in PAIRS}
MS=["m0","m2","m4","m10","m20"]

def orient(pc,poisoned,workers):
    # flip PC1 so attackers (or, in m0, nobody) end on the right; sign of PCA is arbitrary
    pc=np.array(pc); pz=np.array(poisoned,bool)
    if pz.any() and pc[pz,0].mean()<pc[~pz,0].mean(): pc[:,0]*=-1
    return pc,pz,np.array(workers)

# d1: PCA scatter, rows = pairs, cols = m
cols=["m0","m4","m20"]
fig,axs=plt.subplots(2,3,figsize=(12.4,7.6))
for i,(p,title,c) in enumerate(PAIRS):
    for j,m in enumerate(cols):
        ax=axs[i,j]; ax.grid(False); ax.spines["left"].set_visible(True)
        pc,pz,_=orient(PTS[p][m]["pc"],PTS[p][m]["poisoned"],PTS[p][m]["workers"])
        ax.scatter(pc[~pz,0],pc[~pz,1],s=14,color=GRAY,alpha=0.55,linewidths=0,label="Honest update")
        if pz.any(): ax.scatter(pc[pz,0],pc[pz,1],s=34,color=c,marker="x",linewidths=1.6,label="Malicious update")
        lo,hi=np.percentile(pc,[0.5,99.5],axis=0); pad=(hi-lo)*0.12
        ax.set_xlim(lo[0]-pad[0],hi[0]+pad[0]); ax.set_ylim(lo[1]-pad[1],hi[1]+pad[1])
        ax.set_xticks([]); ax.set_yticks([])
        n=int(pz.sum()); ax.set_title(f"{m[1:]}% malicious" + (f"  ({n} of {len(pz)} updates)" if n else "  (no attackers)"),fontsize=14,color=MUT,loc="left")
        if j==0: ax.set_ylabel(title+"\n\nPC 2",fontsize=15,color=INK)
        if i==1: ax.set_xlabel("PC 1",fontsize=14)
h=[Line2D([],[],marker="o",ls="",color=GRAY,ms=6,label="Honest update"),Line2D([],[],marker="x",ls="",color=P1,ms=8,mew=1.8,label="Malicious update, Test 1"),
   Line2D([],[],marker="x",ls="",color=P2,ms=8,mew=1.8,label="Malicious update, Test 2")]
fig.legend(handles=h,loc="lower center",ncol=3,fontsize=14,bbox_to_anchor=(0.5,-0.04))
fig.tight_layout(rect=(0,0.04,1,1)); save(fig,"d1_pca")

# d2: one dot per participant, x = its average PC1 score (in honest SDs from the honest median)
fig,axs=plt.subplots(1,2,figsize=(12.4,5.0),sharey=True)
for ax,(p,title,c) in zip(axs,PAIRS):
    ax.grid(True,axis="x"); ax.grid(False,axis="y")
    for k,m in enumerate(MS):
        pc,pz,w=orient(PTS[p][m]["pc"],PTS[p][m]["poisoned"],PTS[p][m]["workers"])
        ws=sorted(set(w.tolist())); avg=np.array([pc[w==x,0].mean() for x in ws]); mal=np.array([pz[w==x].any() for x in ws])
        hon=avg[~mal]; z=(avg-np.median(hon))/hon.std()
        rng=np.random.default_rng(k); jit=rng.uniform(-0.18,0.18,len(z))
        y=len(MS)-1-k
        ax.scatter(z[~mal],y+jit[~mal],s=26,color=GRAY,alpha=0.7,linewidths=0)
        if mal.any(): ax.scatter(z[mal],y+jit[mal],s=60,color=c,marker="x",linewidths=2)
        r=RES[p][m]["R_full"]["participant_rule"]
        txt="no clear split, nobody flagged" if not r["acted"] else f"flagged {r['malicious_caught']}/{r['malicious_seen']} attackers + {r['honest_flagged']} honest"
        ax.text(1.0,y+0.3,txt,transform=ax.get_yaxis_transform(),ha="right",fontsize=12,color=MUT)
    ax.set_yticks(range(len(MS)),[f"{m[1:]}%" for m in MS[::-1]]); ax.tick_params(axis="y",length=0)
    ax.set_ylim(-0.5,len(MS)-0.3)
    ax.set_xticks(range(-4,9,2)); ax.set_xlim(-4.8,8.4)
    ax.set_title(title,loc="left",fontsize=16); ax.set_xlabel("Participant's average PC 1 score (honest SDs)")
axs[0].set_ylabel("Malicious participants")
save(fig,"d2_participants")
print("ok")
