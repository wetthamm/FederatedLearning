import torch.nn as nn

FEMNIST_NUM_CLASSES = 62


class FEMNISTCNN(nn.Module):
    """
    The paper's Fashion-MNIST CNN (Table 6) with the output layer widened
    from 10 to 62 classes. FEMNIST images are also 1x28x28, so every other
    layer is unchanged:

        Conv(5x5, 1->16) + BN + ReLU, MaxPool 2x2
        Conv(5x5, 16->32) + BN + ReLU, MaxPool 2x2
        FC 1568 -> 62

    The final layer is named ``fc`` so ``fc.weight[c]`` holds the parameters
    connected to the output node of class ``c`` (used by the defense).
    """

    def __init__(self):
        super(FEMNISTCNN, self).__init__()

        self.layer1 = nn.Sequential(
            nn.Conv2d(1, 16, kernel_size=5, padding=2),
            nn.BatchNorm2d(16),
            nn.ReLU(),
            nn.MaxPool2d(2))
        self.layer2 = nn.Sequential(
            nn.Conv2d(16, 32, kernel_size=5, padding=2),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2))

        self.fc = nn.Linear(7 * 7 * 32, FEMNIST_NUM_CLASSES)

    def forward(self, x):
        x = self.layer1(x)
        x = self.layer2(x)

        x = x.view(x.size(0), -1)

        x = self.fc(x)

        return x
