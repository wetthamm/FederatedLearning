"""Data / demo / comparison charts (e1-e4). Run from the repo root:
python3 writeup/deck_charts/charts_system.py [--models]   (--models needs results_models and analysis/model_comparison.json)"""
import json, pickle, sys, numpy as np, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
OUT="writeup/deck_charts/"
INK="#1B2433"; MUT="#4A5568"; GRID="#DDE2EA"; P1="#D9480F"; P2="#2E6DB4"; HON="#1F8A70"; GRAY="#8A94A6"; LG="#C5CCD8"
plt.rcParams.update({"font.family":"Carlito","font.size":15,"text.color":INK,"axes.labelcolor":MUT,"xtick.color":MUT,"ytick.color":MUT,
  "axes.edgecolor":GRID,"axes.spines.top":False,"axes.spines.right":False,"axes.spines.left":False,"axes.grid":True,"axes.grid.axis":"y",
  "grid.color":GRID,"grid.linewidth":0.8,"axes.axisbelow":True,"legend.frameon":False,"savefig.dpi":200,"figure.facecolor":"white"})
def save(fig,n): fig.savefig(OUT+n+".png",bbox_inches="tight",pad_inches=0.08); plt.close(fig)
L=[str(i) for i in range(10)]+[chr(65+i) for i in range(26)]+[chr(97+i) for i in range(26)]
cc=json.load(open("analysis/femnist_class_counts.json")); tr=np.array(cc["train"]); te=np.array(cc["test"])

# e1 class counts
fig,ax=plt.subplots(figsize=(12.4,4.2))
col=[GRAY]*62; col[L.index("O")]=P1; col[L.index("0")]=P1; col[L.index("A")]=P2; col[L.index("h")]=P2
ax.bar(range(62),tr,color=col,width=0.78)
ax.set_xticks(range(62),L,fontsize=11); ax.tick_params(axis="x",length=0); ax.set_xlim(-0.8,61.8)
ax.set_ylabel("Training images"); ax.set_ylim(0,4600)
for x0,x1,t in [(0,9,"digits: 36,345 / 4,157"),(10,35,"uppercase: 19,955 train / 2,284 test"),(36,61,"lowercase: 17,125 / 1,900")]:
    ax.annotate("",xy=(x0-0.4,4350),xytext=(x1+0.4,4350),arrowprops=dict(arrowstyle="-",color=MUT,lw=1))
    ax.text((x0+x1)/2,4420,t,ha="center",va="bottom",fontsize=13,color=MUT)
for ch in "0OAh":
    i=L.index(ch)
    if ch=="0": ax.text(i,tr[i]-120,f"{tr[i]:,}",ha="center",va="top",rotation=90,fontsize=11,color="white")
    else: ax.text(i,tr[i]+60,f"{tr[i]:,}",ha="center",fontsize=11,color=INK)
save(fig,"e1_class_counts")

# e2 training examples
ds=pickle.load(open("data_loaders/femnist/train_data_loader.pickle","rb")).dataset
X,Y=ds.tensors[0].numpy()[:,0],ds.tensors[1].numpy()
chars="0O1lAh5Sek"
fig,axs=plt.subplots(1,len(chars),figsize=(len(chars)*1.25,1.75))
for a,ch in zip(axs,chars):
    i=np.where(Y==L.index(ch))[0][7]; a.imshow(X[i],cmap="gray",vmin=0,vmax=1)
    a.set_xticks([]); a.set_yticks([]); [s.set_visible(True) for s in a.spines.values()]; [s.set_color(GRID) for s in a.spines.values()]
    a.set_title(f"‘{ch}’  #{L.index(ch)}",fontsize=13,color=INK)
save(fig,"e2_train_examples")

if "--models" in sys.argv:
    import torch
    sys.path.insert(0,".")
    from demo import load_model, load_test
    M=[("Clean model","results_models/label_flipping/0_to_0/m0/3000_final_model.pt",HON),
       ("‘O’→‘0’ attack, 50%","results_models/label_flipping/24_to_0/m50/3000_final_model.pt",P1),
       ("‘A’→‘h’ attack, 50%","results_models/label_flipping/10_to_43/m50/3000_final_model.pt",P2)]
    TX,TY=load_test()
    nets=[(n,load_model(p),c) for n,p,c in M]
    sel=json.load(open("analysis/demo_examples.json"))
    # e3 confidence for one 'O' and one 'A' test image: top-1 + next 4 + rest
    fig,axs=plt.subplots(2,4,figsize=(13.0,5.4),gridspec_kw={"width_ratios":[0.55,1,1,1]})
    for r,key in enumerate(["O","A"]):
        i=sel[key]; axs[r,0].imshow(TX[i,0],cmap="gray",vmin=0,vmax=1); axs[r,0].set_xticks([]); axs[r,0].set_yticks([])
        [s.set_visible(True) for s in axs[r,0].spines.values()]; [s.set_color(GRID) for s in axs[r,0].spines.values()]
        axs[r,0].set_title(f"true ‘{key}’ (test #{i})",fontsize=13)
        for j,(n,net,c) in enumerate(nets):
            ax=axs[r,j+1]
            with torch.no_grad(): p=torch.softmax(net(TX[i:i+1]),1)[0].numpy()
            o=np.argsort(-p)[:4]; vals=list(p[o])+[1-p[o].sum()]; labs=[f"‘{L[k]}’" for k in o]+["other 58"]
            cols=[c]+[LG]*3+["#E6E9EF"]
            y=np.arange(5)[::-1]; ax.barh(y,vals,color=cols,height=0.62)
            for yy,v in zip(y,vals): ax.text(v+0.02,yy,f"{v:.1%}" if v>=0.001 else "<0.1%",va="center",fontsize=12)
            ax.set_yticks(y,labs,fontsize=13); ax.tick_params(axis="y",length=0); ax.set_xlim(0,1.28); ax.set_xticks([]); ax.grid(False)
            ax.spines["bottom"].set_visible(False)
            if r==0: ax.set_title(n,fontsize=14,color=INK,loc="left")
    fig.tight_layout(); save(fig,"e3_confidence")
    # e4 comparison accuracy by test set
    R=json.load(open("analysis/model_comparison.json"))
    sets=["FEMNIST easy","FEMNIST hard","Fonts (ours)"]
    fig,axs=plt.subplots(1,2,figsize=(12.6,4.6))
    w=0.26; x=np.arange(3)
    for k,(n,_,c) in enumerate(M):
        mk=list(R.keys())[k]
        acc=[R[mk][s]["accuracy"]*100 for s in sets]; conf=[R[mk][s]["top1_conf_mean"]*100 for s in sets]
        for ax,v in ((axs[0],acc),(axs[1],conf)):
            b=ax.bar(x+(k-1)*w,v,w*0.92,color=c,label=n)
            for xx,vv in zip(x+(k-1)*w,v): ax.text(xx,vv+1,f"{vv:.0f}",ha="center",fontsize=11)
    for ax,t in ((axs[0],"Top-1 accuracy (%)"),(axs[1],"Mean top-1 confidence (%)")):
        ax.set_xticks(x,sets); ax.set_ylim(0,105); ax.set_title(t,loc="left",fontsize=15); ax.tick_params(axis="x",length=0)
    axs[0].legend(loc="upper center",bbox_to_anchor=(1.08,-0.1),ncol=3,fontsize=13)
    save(fig,"e4_comparison")
print("ok")
