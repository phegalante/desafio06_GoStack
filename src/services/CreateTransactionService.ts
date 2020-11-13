import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class CreateTransactionService {
  public async execute(request: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);
    const { title, value, type, category } = request;

    const findCategoryByName = await categoryRepository.findOne({
      where: { title: category },
    });

    let category_id;

    if (findCategoryByName) {
      category_id = findCategoryByName.id;
    } else {
      const createdCategory = categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(createdCategory);
      category_id = createdCategory.id;
    }

    const transaction = transactionRepository.create({
      title,
      type,
      value,
      category_id,
    });

    const balance = await transactionRepository.getBalance();

    if (transaction.type === 'outcome' && balance.total < transaction.value) {
      throw new AppError('Você não tem saldo suficiente para essa transação!');
    }

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
