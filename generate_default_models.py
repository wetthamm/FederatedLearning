from federated_learning.arguments import Arguments
from federated_learning.nets import Cifar10CNN
from federated_learning.nets import FashionMNISTCNN
from federated_learning.nets import FEMNISTCNN
import os
import torch
from loguru import logger

if __name__ == '__main__':
    args = Arguments(logger)
    if not os.path.exists(args.get_default_model_folder_path()):
        os.mkdir(args.get_default_model_folder_path())

    # One fixed initialisation per architecture, shared by every client and
    # every experiment (theta_0 in the paper).
    for model_class in (Cifar10CNN, FashionMNISTCNN, FEMNISTCNN):
        torch.manual_seed(1)
        full_save_path = os.path.join(args.get_default_model_folder_path(), model_class.__name__ + ".model")
        torch.save(model_class().state_dict(), full_save_path)
        logger.info("Saved {}", full_save_path)
